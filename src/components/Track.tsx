import React from 'react';
import './Track.css';
import { Playlist, TrackObject } from "../spotify-api/spotify-playlist";
import { FileProgressStateImpl } from "../utils/download-manager"

export interface TrackProps {
    track: TrackObject;
    progress: FileProgressStateImpl | undefined;
    onClick: (track: TrackObject) => Promise<void>;
}


const Track: React.FC<TrackProps> = ({ track, progress, onClick }) => {
    const imgSrc = track.album.images.length > 0 ? track.album.images
        .sort((a, b) => (a.width||0) - (b.width||0))[0]?.url : '';
    const trackArtistsStrg = track.artists.map(x => x.name).join(' ');

    const trackEltStyle =
        {
            "--progress": `${progress  && !progress.finished ? progress.percentageProgress() : 0}%`,
            "--progress-opacity": `${progress && !progress.finished ? 1 : 0}`,
            "--track-elt-bg": `var(${progress ? (!progress.finished ? "--bg-in-progress" : "--bg-complete") : "--bg-default"})`
        } as React.CSSProperties;

    return (
        <div className="trackElt" onClick={async () => await onClick(track)} style={trackEltStyle}>
            <img loading='lazy' className="cover" src={imgSrc} />

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
