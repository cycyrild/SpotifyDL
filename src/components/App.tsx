import React from 'react';
import Track from './Track';
import useSpotifyData from '../hooks/use-spotify-data';
import * as Helpers from '../utils/helpers';
import { MediaType } from '../spotify-api/interfaces';
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch, faCircleExclamation, faStream, faCompactDisc, faMusic, faFile } from '@fortawesome/free-solid-svg-icons';
import { faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons'
import { TracksCommonFields, } from '../spotify-api/interfaces';
import { DownloadResult } from '../downloader';
import { isUpdated } from '../utils/updateCheck';
import { TrackObjectSimplified } from '../spotify-api/spotify-types';
import { AudioFormat, AudioFormatUtil } from '../audioformats';

const App: React.FC = () => {
  const { tracksCommonFields, spotifyAccessToken, loading, downloaderRef, overallProgress, remainingItems, progressDetails, error } = useSpotifyData();
  const [updated, setUpdated] = React.useState(false);

  const bottomStyles = {
    "--progress": `${overallProgress}%`,
    "--bg-color": remainingItems == 0 ? "var(--bg-1)" : "var(--bg-2)"
  } as React.CSSProperties;

  const [audioQuality, setAudioQuality] = React.useState(AudioFormat.MP4_128_DUAL);

  const chromeDownload = (file: DownloadResult) => {
    Helpers.chromeDownload(file.data, file.metadata.original_title);
  }

  const trackDownload = async (track: TrackObjectSimplified) => {
    if (progressDetails[track.id] && !progressDetails[track.id].complete()) {
      console.log('Download not completed');
      return;
    }

    if (spotifyAccessToken.current && downloaderRef.current) {
      await downloaderRef.current.DownloadTrackAndDecrypt(new Set([track.id]), spotifyAccessToken.current, audioQuality, chromeDownload);
    } else {
      console.error('No access token or downloader available');
    }
  };

  const downloadAll = async () => {
    if (remainingItems != 0) {
      console.log('Download not completed');
      return;
    }

    if (spotifyAccessToken.current && downloaderRef.current && tracksCommonFields) {
      const uniqueTrackIds = new Set(tracksCommonFields.tracks.map(x => x.id));
      await downloaderRef.current.DownloadTrackAndDecrypt(uniqueTrackIds, spotifyAccessToken.current, audioQuality, chromeDownload);
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

  return (
    <>
      <div className="top top-elt ui-bar">
        <h1>SPOTIFY DL V1</h1>
      </div>

      <div className='safe-area'>
        {loading &&
          <div className='center'>
            <FontAwesomeIcon
              icon={faCircleNotch}
              size="6x"
              className="spin"
            />
          </div>}

        {error &&
          <div className='center'>
            <div className='error'>
              <FontAwesomeIcon
                icon={faCircleExclamation}
                size="6x"
                className='icon'
              />
              <pre>{error}</pre>
            </div>
          </div>}
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
              icon={faFile}
            />
            <select value={audioQuality} onChange={(e) => setAudioQuality(e.target.value as AudioFormat)}>
              {Object.values(AudioFormat).filter(x => AudioFormatUtil.isAAC(x)).map((format, index) => (
                <option key={index} value={format}>{format}</option>
              ))}
            </select>
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

        {!loading && !error &&
          <div className="button" style={bottomStyles} onClick={downloadAll}>

            <div className="button-section">
              {remainingItems != 0 ? `${overallProgress}% - REAMING: ${remainingItems}` : `DOWNLOAD ALL`}
            </div>
            <div className="progress"></div>
          </div>
        }


        {!updated && <div className='updated'>A new version is available!</div>}
      </div>
    </>
  );

};

export default App;
