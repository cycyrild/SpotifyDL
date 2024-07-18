import * as Base62 from "./base62";
import { ImageSize, TrackMetadata } from "./metadata";
import * as Helpers from "../utils/helpers"
import { SpotifyPlaylist, SpotifyTrack } from "./spotifyPlaylist";

class SpotifyAPI {
    static getTrackGid(trackId: string): string {
        return Base62.decodeToBigint(trackId).toString(16).padStart(32, "0");
    }

    private static async fetchWithToken(url: string, accessToken: string, options: RequestInit = {}): Promise<Response> {
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

        return fetch(url, mergedOptions);
    }

    static async getCoverUrl(fileMetadata: TrackMetadata, imageSize: ImageSize) : Promise<string|undefined>
    {
        const coverHash = fileMetadata.album.cover_group?.image?.find(x => x.size === imageSize)?.file_id;
        if(coverHash) {
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

    static async getWidevineLicense(challenge: ArrayBuffer, accessToken: string): Promise<Uint8Array> {
        const url = 'https://gue1-spclient.spotify.com/widevine-license/v1/audio/license';
        const options: RequestInit = {
            method: 'POST',
            body: challenge,
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        };

        const response = await this.fetchWithToken(url, accessToken, options);
        const data = await response.arrayBuffer();
        return new Uint8Array(data);
    }

    static async *getPlaylistInfo(playlistId, accessToken) {
        const fetchWithToken = this.fetchWithToken;
    
        try {
            const firstPageReq = await fetchWithToken(`https://api.spotify.com/v1/playlists/${playlistId}`, accessToken);
    
            if (!firstPageReq.ok) {
                throw new Error(`Failed to fetch playlist: ${firstPageReq.statusText}`);
            }
    
            const firstPage = await firstPageReq.json();
    
            if (!firstPage.tracks || !firstPage.tracks.items) {
                throw new Error("Invalid response structure");
            }
    
            let tracks = [...firstPage.tracks.items];
            let nextPage = firstPage.tracks.next;
    
            while (nextPage) {
                const decodedNextPage = decodeURIComponent(nextPage);
                const pageReq = await fetchWithToken(decodedNextPage, accessToken);
    
                if (!pageReq.ok) {
                    throw new Error(`Failed to fetch next page: ${pageReq.statusText}`);
                }
    
                const parsedPage = await pageReq.json();
    
                if (!parsedPage.items) {
                    throw new Error("Invalid page response structure");
                }
    
                tracks = [...tracks, ...parsedPage.items];
                nextPage = parsedPage.next;
            }
    
            firstPage.tracks.items = tracks;
            yield firstPage;
        } catch (error) {
            console.error(`Error in getPlaylistInfo: ${error.message}`);
            throw error;
        }
    }
    

    static async getAllTracksFromPlaylist(playlistId: string, accessToken: string): Promise<[SpotifyTrack[], string]> {
        const playlistIterator = SpotifyAPI.getPlaylistInfo(playlistId, accessToken);
        let playlistName: string|undefined = undefined;

        let allTracks: SpotifyTrack[] = [];
    
        for await (const playlist of playlistIterator) {
            if(!playlistName)
                playlistName = playlist.name
            const tracks = playlist.tracks.items.map(item => item.track);
            allTracks = [...allTracks, ...tracks];
        }

        if(!playlistName)
            throw new Error("Playlist name undefined");

        return [allTracks, playlistName];
    }
}

export default SpotifyAPI;
