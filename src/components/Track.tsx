import React from 'react';
import * as styles from './Track.module.css';
import { TrackObjectSimplified, ImageObject, TrackObjectFull } from "../spotify-api/spotify-types";
import { CommonFields } from '../spotify-api/interfaces';
import { FileProgressStateImpl } from "../utils/download-manager"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfo } from '@fortawesome/free-solid-svg-icons';
import TrackInfo from './TrackInfo';

export interface TrackProps<T extends TrackObjectSimplified> {
    track: T;
    commonFields: CommonFields;
    progress: FileProgressStateImpl | undefined;
    trackPlay: (track: T) => Promise<void>;
}


const Track: React.FC<TrackProps<TrackObjectSimplified>> = ({ track, commonFields, progress, trackPlay }) => {

    const getImgSrc = () => {

        function isTrackObjectContainAlbum(track: TrackObjectSimplified | TrackObjectFull): track is TrackObjectFull {
            return (track as TrackObjectFull).album !== undefined;
        };

        function getTinyestImage(images: ImageObject[]) {
            const filtered = images
                .filter(x => x.height && x.width && x.url)
                .map(x => ({ height: x.height as number, width: x.width as number, url: x.url }));

            const res = filtered.sort((a, b) => (a.width || 0) - (b.width || 0))[0].url;
            return res;
        }

        if (isTrackObjectContainAlbum(track) && track.album.images.length > 0) {
            return getTinyestImage(track.album.images);
        }

        return getTinyestImage(commonFields.images);
    }


    const trackArtistsStrg = track.artists.map(x => x.name).join(' ');

    const [moreInfoOpen, setMoreInfoOpen] = React.useState(false);

    const trackEltStyle =
        {
            "--progress": `${progress && !progress.finished ? progress.percentageProgress() : 0}%`,
            "--progressOpacity": `${progress && !progress.finished ? 1 : 0}`,
            "--trackHeadBg": `var(${progress ? (!progress.finished ? "--bgInProgress" : (!progress.error ? "--bgComplete" : "--bgError")) : "--bgDefault"})`
        } as React.CSSProperties;

    const handleInfoClick = (event) => {
        event.stopPropagation();
        setMoreInfoOpen(!moreInfoOpen);
    };


    return (
        <div className={`${styles.trackElt} ${moreInfoOpen && styles.open}`} >
            <div className={styles.trackHead} onClick={async () => await trackPlay(track)} style={trackEltStyle}>
                <img loading='lazy' className={styles.square} src={getImgSrc()} />

                <div className={styles.trackPrimary}>
                    <div className={styles.title}>
                        {track.name}
                    </div>
                    <div className={styles.artists}>
                        {trackArtistsStrg}
                    </div>
                </div>

                {/*<div className={`${styles.btn} ${styles.square} ${styles.center}`} onClick={handleInfoClick}>
                    <FontAwesomeIcon icon={faInfo} size='1x' />
                </div>*/}
            </div>
            {/*<div className={styles.trackMoreInfo}>
                {moreInfoOpen &&
                    <TrackInfo></TrackInfo>
                }
            </div>*/}

        </div>
    );

};

export default Track;
