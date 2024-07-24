import React from 'react';
import Track from './Track';
import useSpotifyData from '../hooks/useSpotifyData';
import * as Helpers from '../utils/helpers';
import { TrackObject } from '../spotify-api/spotify-playlist';
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faDiscord } from '@fortawesome/free-brands-svg-icons'

import { DownloadResult } from '../downloader';

const App: React.FC = () => {
  const { tracks, tracksTitle, spotifyAccessToken, loading, downloaderRef, overallProgress, remainingItems, progressDetails, error } = useSpotifyData();

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
    if (spotifyAccessToken.current && downloaderRef.current) {
      await downloaderRef.current.DownloadTrackAndDecrypt(new Set(tracks.map(x => x.id)), spotifyAccessToken.current, audioQuality, chromeDownload);
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


  return (


    <div>

      <div className="top top-elt ui-bar">
        <h1>SPOTIFY DL V1</h1>
      </div>
      <h3 className='window-title'>{tracksTitle}</h3>

      <div className='tracks'>
        {tracks.map((track, index) => (
          <Track progress={progressDetails[track.id]} key={index} track={track} onClick={trackDownload} />
        ))}
      </div>

      <div className='bottom-bar ui-bar'>
        <div className='bubble'>
          <FontAwesomeIcon
            icon={faDiscord}
          />
          cyril13600
        </div>
        <div className="button" style={bottomStyles} onClick={downloadAll}>

          <div className="button-section">
            {remainingItems != 0 ? `${overallProgress}% - REAMING: ${remainingItems}` : `DOWNLOAD ALL`}
          </div>
          <div className="progress"></div>
        </div>
      </div>

    </div>
  );

};

export default App;
