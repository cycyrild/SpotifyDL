import { MediaType } from "./spotify-api/interfaces";

export const MEDIA_TYPE_URL_ARG = 'mediatype';
export const MEDIA_ID_URL_ARG = 'mediaid';

export function craftPopupUrl(mediaType: string, id: string) {
    return `popup.html?${MEDIA_TYPE_URL_ARG}=${mediaType}&${MEDIA_ID_URL_ARG}=${id}`;
}

export function parseMediaTypeAndIdFromUrl(url: string) {
    const mediaTypes = Object.values(MediaType).join('|');
    const spotifyUrlPattern = new RegExp(`https://.*open.spotify.com.*/(${mediaTypes})/([a-zA-Z0-9]+)`);
    const match = url.match(spotifyUrlPattern);

    if (match) {
        const mediaType = match[1] as MediaType;
        const id = match[2];
        return [mediaType, id];
    }

    return undefined;
}