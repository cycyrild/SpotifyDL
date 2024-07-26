import React from 'react';
import './Track.css';
import { TrackObjectSimplified, ImageObject, TrackObjectFull } from "../spotify-api/spotify-types";
import { CommonFields } from '../spotify-api/interfaces';
import { FileProgressStateImpl } from "../utils/download-manager"
export interface TrackProps<T extends TrackObjectSimplified> {
    track: T;
    commonFields: CommonFields;
    progress: FileProgressStateImpl | undefined;
    onClick: (track: T) => Promise<void>;
}


const Track: React.FC<TrackProps<TrackObjectSimplified>> = ({ track, commonFields, progress, onClick }) => {

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

    const trackEltStyle =
        {
            "--progress": `${progress && !progress.finished ? progress.percentageProgress() : 0}%`,
            "--progress-opacity": `${progress && !progress.finished ? 1 : 0}`,
            "--track-elt-bg": `var(${progress ? (!progress.finished ? "--bg-in-progress" : "--bg-complete") : "--bg-default"})`
        } as React.CSSProperties;

    return (
        <div className="trackElt" onClick={async () => await onClick(track)} style={trackEltStyle}>
            <img loading='lazy' className="cover" src={getImgSrc()} />

            <div className="infoTrack">
                <div className="title" >
                    {track.name}
                </div>
                <div className="artists">
                    {trackArtistsStrg}
                </div>
            </div>

        </div>
    );

};

export default Track;
