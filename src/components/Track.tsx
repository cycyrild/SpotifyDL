import React from 'react';
import './Track.css'
import { SpotifyPlaylist, SpotifyTrack } from "../spotify-api/spotifyPlaylist";

export interface TrackProps {
    track: SpotifyTrack;
    progress:number|undefined;
    onClick: (track: SpotifyTrack) => void;
}


const Track: React.FC<TrackProps> = ({ track, progress, onClick }) => {
    const imgSrc = track.album.images.length > 0 ? track.album.images.sort((a, b) => a.width - b.width)[0]?.url : '';
    const trackArtistsStrg = track.artists.map(x => x.name).join(' ');
    const trackEltStyle =
    {
        "--progress": `${progress ? (progress * 100).toFixed(2) : 0}%`
    } as React.CSSProperties;

    return (
        <div className="track-elt" onClick={() => onClick(track)} style={trackEltStyle}>
            <img loading='lazy' className="cover" src={imgSrc} />

            <div className="info-track">
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