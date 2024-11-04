import { TrackObjectFull, TrackObjectSimplified } from "../spotify-api/spotify-types";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserMusic, faMusic, faAlbum, faCalendarDay, faBinary } from '@lib/pro-solid-svg-icons';

import style from "./TrackInfo.module.css";
import React from "react";
import { craftPopupUrl } from "../utils";
import { MediaType } from "../spotify-api/interfaces";

interface TrackInfoProps {
    track: TrackObjectSimplified | TrackObjectFull;
}

const TrackInfo: React.FC<TrackInfoProps> = (props) => {
    return (
        <div className={style.header}>
            <div className={`${style.iconText} ${style.headerItem} ${style.trackName}`}>
                <FontAwesomeIcon icon={faMusic} />
                {props.track.name}
            </div>
            <div className={`${style.iconText} ${style.headerItem} ${style.artists}`}>
                <FontAwesomeIcon icon={faUserMusic} />
                <div className={style.list}>
                    {props.track.artists.map((artist) => (
                        <div key={artist.id}>{artist.name}</div>
                    ))}
                </div>
            </div>
            {'album' in props.track &&  (
                <>
                    <div className={`${style.iconText} ${style.headerItem} ${style.album}`}>
                        <FontAwesomeIcon icon={faAlbum} />
                        <a key={props.track.album.id} href={craftPopupUrl(MediaType.Album, props.track.album.id)}>
                            {props.track.album.name}
                        </a> 
                    </div>
                    <div className={`${style.iconText} ${style.headerItem} ${style.album}`}>
                        <FontAwesomeIcon icon={faCalendarDay} />
                        {props.track.album.release_date}
                    </div>
                </>
            )}
            {'external_ids' in props.track && props.track.external_ids.isrc && (
                <div className={`${style.iconText} ${style.headerItem} ${style.externalIds}`}>
                    <FontAwesomeIcon icon={faBinary} />
                    {props.track.external_ids.isrc}
                </div>
            )}
        </div>
    );
};

export default TrackInfo;
