import React from 'react';
import Track from './Track';
import useSpotifyData from '../hooks/use-spotify-data';
import * as Helpers from '../utils/helpers';
import { MediaType } from '../spotify-api/interfaces';
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faStream, faCompactDisc, faMusic, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons'
import { DownloadResult } from '../downloader';
import { isUpdated } from '../utils/updateCheck';
import { TrackObjectSimplified } from '../spotify-api/spotify-types';
import LoadingComponent from './Loading';
import CriticalErrorComponent from './Error';
import { removeAccessTokenFromCache } from '../spotifyauth';
import SettingsComponent from './Settings';

const App: React.FC = () => {
  const
  {
    tracksCommonFields: tracksCommonFields,
    loading: loadingShow,
    downloaderRef: downloaderRef,
    overallProgress: overallProgress,
    remainingItems: remainingItems,
    progressDetails: progressDetails,
    error: errorShow,
    currentSettings : currentSettings,
  } = useSpotifyData();

  const [updated, setUpdated] = React.useState(false);
  const [settingsShow, setSettingsOpen] = React.useState(false);

  const bottomStyles = {
    "--progress-opacity": remainingItems == 0 ? "0" : "1",
    "--progress": `${overallProgress}%`,
    "--bg-color": !loadingShow && !errorShow ? (remainingItems == 0 ? "var(--bg-ready)" : "var(--bg-progress)") : "var(--bg-disabled)"
  } as React.CSSProperties;

  const chromeDownload = (file: DownloadResult) => {
    Helpers.chromeDownload(file.data, file.extension, file.metadata.original_title);
  }

  const singleTrackDownload = async (track: TrackObjectSimplified) => {
    if (progressDetails[track.id] && !progressDetails[track.id].complete()) {
      console.log('Download not completed');
      return;
    }

    if (downloaderRef.current) {
      const set = new Set([track.id]);
      await downloaderRef.current.DownloadTracksAndDecrypt(set, chromeDownload);
    } else {
      console.error('No access token or downloader available');
    }
  };

  const downloadAllTracks = async () => {

    if (loadingShow || errorShow) {
      console.log('Not ready to download');
      return;
    }

    if (remainingItems != 0) {
      console.log('Download not completed');
      return;
    }

    if (downloaderRef.current && tracksCommonFields) {
      const uniqueTrackIds = new Set(tracksCommonFields.tracks.map(x => x.id));
      await downloaderRef.current.DownloadTracksAndDecrypt(uniqueTrackIds, chromeDownload);
    } else {
      console.error('No access token or downloader available');
    }
  }

  React.useEffect(() => {
    (async () => {
      const updated = await isUpdated();
      setUpdated(updated)
    })();
  }, []);

  const getIcon = (type: MediaType) => {
    switch (type) {
      case MediaType.Playlist:
        return faStream

      case MediaType.Album:
        return faCompactDisc

      case MediaType.Track:
        return faMusic;
    }
  }

  const reconnect = async () => {
    await removeAccessTokenFromCache();
    window.location.reload();
  }

  const switchOpenSettings = () => {
    setSettingsOpen(!settingsShow);
  }

  return (
    <>
      <div className="top top-elt ui-bar">
        <h1>SpotifyDL</h1>
      </div>

      {tracksCommonFields &&
        <h2>
          <FontAwesomeIcon icon={getIcon(tracksCommonFields.commonFields.type)}></FontAwesomeIcon>
          <span>{tracksCommonFields.commonFields.name}</span>
        </h2>
      }

      <div className='tracks'>
        {tracksCommonFields?.tracks.map((track, index) => (
          <Track commonFields={tracksCommonFields.commonFields} progress={progressDetails[track.id]} key={index} track={track} trackPlay={singleTrackDownload} />
        ))}
      </div>

      <div className='bottom-bar ui-bar'>
        <div className='bubbles'>
          <div className={`bubble btn${settingsShow ? ' enabled' : ''}`} onClick={switchOpenSettings} style={{ cursor: "pointer" }}>
            <FontAwesomeIcon
              icon={faGear}
            />
            Settings
          </div>

          <div className='bubble btn' onClick={reconnect} style={{ cursor: "pointer" }}>
            <FontAwesomeIcon
              icon={faArrowsRotate}
            />
            Reconnect
          </div>

          <div className='bubble'>
            <FontAwesomeIcon
              icon={faDiscord}
            />
            cyril13600
          </div>

          <div className='bubble'>
            <FontAwesomeIcon
              icon={faGithub}
            />
            cycyrild/SpotifyDL
          </div>

        </div>

        <div className="big-button" style={bottomStyles} onClick={downloadAllTracks}>

          <div className="button-section">
            {remainingItems != 0 ? `${overallProgress}% - REAMING: ${remainingItems}` : `DOWNLOAD ALL`}
          </div>
          <div className="progress"></div>
        </div>


        {!updated && <div className='updated'>A new version is available!</div>}
      </div>
      <div className='safe-area'>
        {loadingShow &&
          <LoadingComponent />}

        {errorShow &&
          <CriticalErrorComponent error={errorShow} />}

        {settingsShow &&
          <SettingsComponent currentSettings={currentSettings}></SettingsComponent>}

        
      </div>
    </>
  );

};

export default App;
