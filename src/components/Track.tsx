import React from 'react';
import styles from './Track.module.css';
import { TrackObjectSimplified, ImageObject, TrackObjectFull } from "../spotify-api/spotify-types";
import { CommonFields } from '../spotify-api/interfaces';
import { FileProgressState } from "../utils/download-manager";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo } from '@lib/pro-solid-svg-icons';
import TrackInfo from './TrackInfo';

export interface TrackProps<T extends TrackObjectSimplified> {
    track: T;
    commonFields: CommonFields;
    progress: FileProgressState | undefined;
    trackPlay: (track: T) => Promise<void>;
}


const Track: React.FC<TrackProps<TrackObjectSimplified>> = ({ track, commonFields, progress, trackPlay }) => {

    const trackMoreInfoComponentRef = React.useRef<HTMLDivElement>(null);
    const trackComponentRef = React.useRef<HTMLDivElement>(null);


    const isTrackObjectContainAlbum = (track: TrackObjectSimplified | TrackObjectFull): track is TrackObjectFull => {
        return (track as TrackObjectFull).album !== undefined;
    };

    const getImgSrc = () => {
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
            "--progress": `${progress && !progress.complete() ? progress.percentageProgress() : 0}%`,
            "--progressOpacity": `${progress && !progress.complete() ? 1 : 0}`,
            "--trackHeadBg": `var(${progress ? (!progress.complete() ? "--bgInProgress" : (!progress.error ? "--bgComplete" : "--bgError")) : "--bgDefault"})`
        } as React.CSSProperties;

    const handleInfoClick = async (event: any) => {
        event.stopPropagation();
        setMoreInfoOpen(!moreInfoOpen);
    };

    React.useEffect(() => {
        computeHeightTrackInfo();
    }, []);

    const computeHeightTrackInfo = () => {

        if (trackMoreInfoComponentRef.current === null)
            throw new Error('Component ref is null');

        if (trackComponentRef.current === null)
            throw new Error('Component ref is null');

        const clone = trackMoreInfoComponentRef.current.cloneNode(true) as HTMLElement;

        clone.style.position = 'absolute';
        clone.style.visibility = 'hidden';
        clone.style.transform = 'none';
        clone.style.height = 'auto';
        clone.style.transition = 'none';

        document.body.appendChild(clone);

        const height = clone.offsetHeight;

        document.body.removeChild(clone);

        trackComponentRef.current.style.setProperty('--trackOpenOffsetHeight', `${height}px`);
    };


    return (
        <div ref={trackComponentRef} className={`${styles.trackElt}${moreInfoOpen ? ` ${styles.open}` : ''}`}>
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

                {<div className={`${styles.btn} ${styles.square} ${styles.center}`} onClick={handleInfoClick}>
                    <FontAwesomeIcon icon={faInfo} size='1x' />
                </div>}
            </div>
            {<div ref={trackMoreInfoComponentRef} className={styles.trackOpenInfo}>
                <TrackInfo track={track}/>
            </div>}

        </div>
    );

};

export default Track;
