import React from 'react';
import Track from './Track';
import useSpotifyData from '../hooks/use-spotify-data';
import * as Helpers from '../utils/helpers';
import { MediaType } from '../spotify-api/interfaces';
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faStream, faCompactDisc, faMusic, faFile, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons'
import { TracksCommonFields, } from '../spotify-api/interfaces';
import { DownloadResult } from '../downloader';
import { isUpdated } from '../utils/updateCheck';
import { TrackObjectSimplified } from '../spotify-api/spotify-types';
import { AudioFormat, AudioFormatUtil } from '../audioformats';
import * as userSettings from '../utils/userSettings';
import LoadingComponent from './Loading';
import ErrorComponent from './Error';
import { removeAccessTokenFromCache } from '../spotifyauth';
import SettingsComponent from './Settings';

const App: React.FC = () => {
  const { tracksCommonFields, spotifyAccessToken, loading, downloaderRef, overallProgress, remainingItems, progressDetails, error } = useSpotifyData();
  const [updated, setUpdated] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const bottomStyles = {
    "--progress": `${overallProgress}%`,
    "--bg-color": !loading && !error ? (remainingItems == 0 ? "var(--bg-ready)" : "var(--bg-progress)") : "var(--bg-disabled)"
  } as React.CSSProperties;

  const [currentSettings, setSettings] = React.useState(userSettings.defaultSettings);

  const chromeDownload = (file: DownloadResult) => {
    Helpers.chromeDownload(file.data, file.metadata.original_title);
  }

  const singleTrackDownload = async (track: TrackObjectSimplified) => {
    if (progressDetails[track.id] && !progressDetails[track.id].complete()) {
      console.log('Download not completed');
      return;
    }

    if (spotifyAccessToken.current && downloaderRef.current) {
      await downloaderRef.current.DownloadTrackAndDecrypt(new Set([track.id]), spotifyAccessToken.current, currentSettings.format, currentSettings.maxDownloadConcurency, chromeDownload);
    } else {
      console.error('No access token or downloader available');
    }
  };

  const downloadAllTracks = async () => {

    if (loading || error) {
      console.log('Not ready to download');
      return;
    }

    if (remainingItems != 0) {
      console.log('Download not completed');
      return;
    }

    if (spotifyAccessToken.current && downloaderRef.current && tracksCommonFields) {
      const uniqueTrackIds = new Set(tracksCommonFields.tracks.map(x => x.id));
      await downloaderRef.current.DownloadTrackAndDecrypt(uniqueTrackIds, spotifyAccessToken.current, currentSettings.format, currentSettings.maxDownloadConcurency,  chromeDownload);
    } else {
      console.error('No access token or downloader available');
    }
  }

  React.useEffect(() => {
    (async () => {
      const updated = await isUpdated();
      setUpdated(updated)

      const settings = await userSettings.loadSettings();
      setSettings(settings);
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
    setSettingsOpen(!settingsOpen);
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
          <Track commonFields={tracksCommonFields.commonFields} progress={progressDetails[track.id]} key={index} track={track} trackPlay={singleTrackDownload} />
        ))}
      </div>

      <div className='bottom-bar ui-bar' style={{ cursor: "pointer" }}>
        <div className='bubbles'>
          <div className={`bubble${settingsOpen ? ' enabled' : ''}`} onClick={switchOpenSettings}>
            <FontAwesomeIcon
              icon={faGear}
            />
            Settings
          </div>

          <div className='bubble' onClick={reconnect} style={{ cursor: "pointer" }}>
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
        {loading &&
          <LoadingComponent />}

        {error &&
          <ErrorComponent error={error} />}

        {settingsOpen &&
          <SettingsComponent currentSettings={currentSettings} setSettings={setSettings}></SettingsComponent>}
      </div>
    </>
  );

};

export default App;
