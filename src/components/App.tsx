import React from 'react';
import Track from './Track';
import useSpotifyData from '../hooks/useSpotifyData';
import * as Helpers from '../utils/helpers';
import { SpotifyTrack } from '../spotify-api/spotifyPlaylist';
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

const App: React.FC = () => {
  const { tracks, tracksTitle, spotifyAccessToken, loading, downloaderRef, overallProgress, remainingItems, progressDetails, error } = useSpotifyData();
  const bottomStyles = { "--progress": `${overallProgress}%`, "--bg-color": remainingItems == 0 ? "var(--bg-1)" : "var(--bg-2)" } as React.CSSProperties;

  const trackDownload = async (track: SpotifyTrack) => {

    if ((track.id in progressDetails))
      return;

    if (spotifyAccessToken && downloaderRef.current) {
      await downloaderRef.current.DownloadTrackAndDecrypt(new Set([track.id]), spotifyAccessToken, 'MP4_128_DUAL', (file) => {
        Helpers.chromeDownload(file.data, file.metadata.original_title);
      });
    } else {
      console.error('No Spotify access token or downloader available');
    }
  }

  const downloadAll = async () => {
    if (remainingItems != 0)
      return;
    if (spotifyAccessToken && downloaderRef.current) {
      await downloaderRef.current.DownloadTrackAndDecrypt(new Set(tracks.map(x => x.id)), spotifyAccessToken, "MP4_128_DUAL", (file) => {
        Helpers.chromeDownload(file.data, file.metadata.original_title);
      });
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
    return <div>{error}</div>
  }

  return (


    <div>

      <div className="top top-elt ui-bar">
        <h1>SPOTIFY DL V1</h1>
      </div>
      <h2>{tracksTitle}</h2>

      <div className='tracks'>
        {tracks.map((track, index) => (
          <Track progress={progressDetails[track.id]} key={index} track={track} onClick={trackDownload} />
        ))}
      </div>

      <div className="bottom ui-bar" style={bottomStyles} onClick={downloadAll}>

        <div className="bottom-section">
          {remainingItems != 0 ? `${overallProgress}% - REAMING: ${remainingItems}` : `DOWNLOAD ALL`}
        </div>
        <div className="progress"></div>
      </div>
    </div>
  );

};

export default App;
