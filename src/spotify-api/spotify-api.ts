import * as Base62 from "./base62";
import { ImageSize, TrackMetadata } from "./metadata";
import { TrackObjectSimplified, PagingObject, PlaylistTrackObject, PlaylistObjectFull, AlbumObjectFull, TrackObjectFull } from "./spotify-types";
import { TracksCommonFields, MediaType } from './interfaces'
import { fetchWithRetry } from "../utils/fetch-helpers";
import { RetryOptions } from "../utils/user-settings";
const PUBLIC_API_URL: string = "https://api.spotify.com/v1";

export class SpotifyAPI {

    private static async fetchWithToken(url: string, accessToken: string, retryOptions?: RetryOptions, options: RequestInit = {}): Promise<Response> {
        const defaultHeaders = {
            authorization: `Bearer ${accessToken}`,
            accept: "application/json",
        };

        const mergedOptions: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            }
        };

        if (retryOptions === undefined) {
            return fetch(url, mergedOptions);
        }
        return fetchWithRetry(url, retryOptions, mergedOptions);
    }

    static getTrackGid(trackId: string): string {
        return Base62.decodeToBigint(trackId).toString(16).padStart(32, "0");
    }

    static async getCoverUrl(fileMetadata: TrackMetadata, imageSize: ImageSize): Promise<string | undefined> {
        const coverHash = fileMetadata.album.cover_group?.image?.find(x => x.size === imageSize)?.file_id;
        if (coverHash) {
            return `https://i.scdn.co/image/${coverHash}`;
        }
        return undefined;
    }

    static async getGidMetadata(gid: string, accessToken: string): Promise<TrackMetadata> {
        const req = await this.fetchWithToken(
            `https://spclient.wg.spotify.com/metadata/4/track/${gid}?market=from_token`,
            accessToken
        );

        return req.json();
    }

    static async getPsshB64(fileId: string, accessToken: string): Promise<string> {
        const req = await this.fetchWithToken(
            `https://seektables.scdn.co/seektable/${fileId}.json`,
            accessToken
        );

        return req.json().then(x => x.pssh);
    }

    static async getStreamUrl(fileId: string, accessToken: string): Promise<string> {
        const req = await this.fetchWithToken(
            `https://gue1-spclient.spotify.com/storage-resolve/v2/files/audio/interactive/11/${fileId}?version=10000000&product=9&platform=39&alt=json`,
            accessToken
        );

        return req.json().then(x => x.cdnurl[0]);
    }

    static async getWidevineLicense(challenge: ArrayBuffer, accessToken: string, retryOptions: RetryOptions): Promise<Uint8Array> {
        const url = 'https://gue1-spclient.spotify.com/widevine-license/v1/audio/license';
        const options: RequestInit = {
            method: 'POST',
            body: challenge,
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        };

        const response = await this.fetchWithToken(url, accessToken, retryOptions, options);
        const data = await response.arrayBuffer();
        return new Uint8Array(data);
    }

    static async getPlayPlayLicense(challenge: ArrayBuffer, fileId: string, accessToken: string, retryOptions: RetryOptions): Promise<Uint8Array> {
        const url = `https://gew4-spclient.spotify.com/playplay/v1/key/${fileId}`;
        const options: RequestInit = {
            method: 'POST',
            body: challenge,
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        };

        const response = await this.fetchWithToken(url, accessToken, retryOptions, options);
        const data = await response.arrayBuffer();
        return new Uint8Array(data);
    }

    static async getAllTracksFromPlaylist(albumId: string, accessToken: string): Promise<TracksCommonFields> {
        const url = `${PUBLIC_API_URL}/playlists/${albumId}`;
        const playlistData = await this.fetchWithToken(url, accessToken);
        const playlistJson: PlaylistObjectFull = await playlistData.json();

        let tracks: PlaylistTrackObject[] = playlistJson.tracks.items;
        let next = playlistJson.tracks.next;

        while (next) {
            const nextPage = await this.fetchWithToken(next, accessToken);
            const nextPageJson: PagingObject<PlaylistTrackObject> = await nextPage.json();
            tracks = tracks.concat(nextPageJson.items);
            next = nextPageJson.next;
        }

        const filteredTracks = tracks.map(x => x.track).filter(x => x) as TrackObjectFull[];

        const res: TracksCommonFields = {
            tracks: filteredTracks,
            commonFields: {
                name: playlistJson.name,
                images: playlistJson.images,
                type: MediaType.Playlist
            }
        }

        return res;
    }

    static async getAllTracksFromAlbum(albumId: string, accessToken: string): Promise<TracksCommonFields> {
        const url = `${PUBLIC_API_URL}/albums/${albumId}`;
        const albumData = await this.fetchWithToken(url, accessToken);
        const albumJson: AlbumObjectFull = await albumData.json();
        let tracks: TrackObjectSimplified[] = albumJson.tracks.items;
        let next = albumJson.tracks.next;

        while (next) {
            const nextPage = await this.fetchWithToken(next, accessToken);
            const nextPageJson: PagingObject<TrackObjectSimplified> = await nextPage.json();

            tracks = tracks.concat(nextPageJson.items);
            next = nextPageJson.next;
        }

        const res: TracksCommonFields = {
            tracks: tracks,
            commonFields: {
                name: albumJson.name,
                images: albumJson.images,
                type: MediaType.Album
            }
        }

        return res;
    }

    static async getTrack(trackId: string, accessToken: string): Promise<TracksCommonFields> {
        const url = `${PUBLIC_API_URL}/tracks/${trackId}`;
        const trackData = await this.fetchWithToken(url, accessToken);
        const trackDataJson: TrackObjectFull = await trackData.json();

        const res: TracksCommonFields = {
            tracks: [trackDataJson],
            commonFields: {
                name: trackDataJson.name,
                images: trackDataJson.album.images,
                type: MediaType.Track
            }
        }

        return res;
    }


}

