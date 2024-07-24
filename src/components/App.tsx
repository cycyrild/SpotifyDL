import React from 'react';
import Track from './Track';
import useSpotifyData from '../hooks/use-spotify-data';
import * as Helpers from '../utils/helpers';
import { TrackObject, MediaType } from '../spotify-api/spotify-types';
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch, faCircleExclamation, faStream, faCompactDisc } from '@fortawesome/free-solid-svg-icons';
import { faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons'
import { TracksCommonFields } from '../spotify-api/interfaces';
import { DownloadResult } from '../downloader';

const App: React.FC = () => {
  const { tracksCommonFields, spotifyAccessToken, loading, downloaderRef, overallProgress, remainingItems, progressDetails, error } = useSpotifyData();

  const bottomStyles = {
    "--progress": `${overallProgress}%`,
    "--bg-color": remainingItems == 0 ? "var(--bg-1)" : "var(--bg-2)"
  } as React.CSSProperties;

  const audioQuality = "MP4_128_DUAL";

  const chromeDownload = (file: DownloadResult) => {
    Helpers.chromeDownload(file.data, file.metadata.original_title);
  }

  const trackDownload = async (track: TrackObject) => {

    if (progressDetails[track.id] && !progressDetails[track.id].complete()) {
      console.log('Download not completed');
      return;
    }

    if (spotifyAccessToken.current && downloaderRef.current) {
      await downloaderRef.current.DownloadTrackAndDecrypt(new Set([track.id]), spotifyAccessToken.current, audioQuality, chromeDownload);
    } else {
      console.error('No Spotify access token or downloader available');
    }
  }

  const downloadAll = async () => {
    if (remainingItems != 0)
      return;
    if (spotifyAccessToken.current && downloaderRef.current && tracksCommonFields) {
      const uniqueTrackIds = new Set(tracksCommonFields.tracks.map(x => x.id));
      await downloaderRef.current.DownloadTrackAndDecrypt(uniqueTrackIds, spotifyAccessToken.current, audioQuality, chromeDownload);
    } else {
      console.error('No Spotify access token or downloader available');
    }
  }


  if (loading) {
    return (
      <FontAwesomeIcon
        icon={faCircleNotch}
        size="6x"
        className="center-icon spin"
      />
    )
  }

  if (error) {
    return (
      <div className='error'>
        <FontAwesomeIcon
          icon={faCircleExclamation}
          size="6x"
        />
        <pre>{error}</pre>
      </div>)
  }

  const getIcon = (type: MediaType) => {
    switch (type) {
      case MediaType.Playlist:
        return faStream

      case MediaType.Album:
        return faCompactDisc
    }
  }

  return (
    <>
      <div className="top top-elt ui-bar">
        <h1>SPOTIFY DL V1</h1>
      </div>
      {tracksCommonFields &&
        <h2>
          <FontAwesomeIcon icon={getIcon(tracksCommonFields.commonFields.type)}></FontAwesomeIcon>
          <span>{tracksCommonFields.commonFields.name}</span>
        </h2>
      }

      <div className='tracks'>
        {tracksCommonFields?.tracks.map((track, index) => (
          <Track commonFields={tracksCommonFields.commonFields} progress={progressDetails[track.id]} key={index} track={track} onClick={trackDownload} />
        ))}
      </div>

      <div className='bottom-bar ui-bar'>
        <div className='bubbles'>
          <div className='bubble'>
            <FontAwesomeIcon
              icon={faDiscord}
            />
            cyril13600
          </div>
          <a className='bubble' href='https://github.com/cycyrild/SpotifyDL' target="_blank">
            <FontAwesomeIcon
              icon={faGithub}
            />
            cycyrild/SpotifyDL
          </a>
        </div>
        <div className="button" style={bottomStyles} onClick={downloadAll}>

          <div className="button-section">
            {remainingItems != 0 ? `${overallProgress}% - REAMING: ${remainingItems}` : `DOWNLOAD ALL`}
          </div>
          <div className="progress"></div>
        </div>
      </div>
    </>
  );

};

export default App;
