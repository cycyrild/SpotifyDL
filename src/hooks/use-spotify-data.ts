import { useEffect, useState, useRef, useCallback } from 'react';
import { Downloader } from '../downloader';
import { getAccessToken } from '../spotifyauth';
import { UIUpdateCallback, FileProgressState } from '../utils/download-manager';
import {SpotifyAPI} from "../spotify-api/spotify-api";
import { TracksCommonFields, MediaType } from '../spotify-api/interfaces';
import * as userSettings from '../utils/userSettings';

const useSpotifyData = () => {
    const [tracksCommonFields, setTracksCommonFields] = useState<TracksCommonFields>();
    const [loading, setLoading] = useState<boolean>(true);
    const [overallProgress, setOverallProgress] = useState<number>(100);
    const [remainingItems, setRemainingItems] = useState<number>(0);
    const [progressDetails, setProgressDetails] = useState<{ [id: string]: FileProgressState }>({});
    const [error, setError] = useState<string | null>(null);

    const currentSettings = useRef(userSettings.defaultSettings);
    const spotifyAccessToken = useRef<string>("");
    const downloaderRef = useRef<Downloader>();

    const normalizeError = (err: any) => {
        if (err instanceof Error) {
            return err;
        } else if (typeof err === 'string') {
            return new Error(err);
        } else {
            return new Error('An error has occurred');
        }
    }

    const downloadState = useCallback<UIUpdateCallback>((overallProgress, remainingItems, progressDetails) => {
        setOverallProgress(overallProgress);
        setRemainingItems(remainingItems);
        setProgressDetails(progressDetails);
    }, []);

    const getIdFromUrl = (url: string): [MediaType, string] | undefined => {
        const mediaTypes = Object.values(MediaType).join('|');
        const spotifyUrlPattern = new RegExp(`https://.*open.spotify.com.*/(${mediaTypes})/([a-zA-Z0-9]+)`);
        const match = url.match(spotifyUrlPattern);
    
        if (match) {
            const mediaType = match[1] as MediaType;
            const id = match[2];
            return [mediaType, id];
        }
    
        return undefined;
    };
    

    const fetchData = async () => {
        try {

            const params = new URLSearchParams(window.location.search);
            const url = params.get('url');
            if (!url) {
                throw new Error("Unable to retrieve current URL.");
            }

            const settings = await userSettings.loadSettings();
            currentSettings.current = settings;

            const token = await getAccessToken();


            if(!token || !token.accessToken) {
                throw new Error("Please log in to Spotify to use this extension.");
            }

            spotifyAccessToken.current = token.accessToken;

            const downloaderLoadTask = Downloader.Create(downloadState, currentSettings, spotifyAccessToken);


            const medias = getIdFromUrl(url);
            let tracksCommonFields: TracksCommonFields;

            if (!medias) {
                throw new Error(`No ${Object.values(MediaType).join(', ')} Spotify currently opened in this tab.\nPlease open one then reopen the extension.`);
            }

            switch (medias[0]) {
                case MediaType.Album:
                    tracksCommonFields = await SpotifyAPI.getAllTracksFromAlbum(medias[1], spotifyAccessToken.current);
                    break;
                case MediaType.Playlist:
                    tracksCommonFields = await SpotifyAPI.getAllTracksFromPlaylist(medias[1], spotifyAccessToken.current);
                    break;
                case MediaType.Track:
                    tracksCommonFields = await SpotifyAPI.getTrack(medias[1], spotifyAccessToken.current);
                    break;

                default:
                    throw new Error(`Unsupported media type: ${medias[0]}`);
            }

            downloaderRef.current = await downloaderLoadTask;
            setTracksCommonFields(tracksCommonFields);
            setLoading(false);
        } catch (error) {
            const normalizedError = normalizeError(error);
            console.error(normalizedError.message, error);
            setError(normalizedError.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [downloadState]);

    return {
        tracksCommonFields,
        spotifyAccessToken,
        loading,
        downloaderRef,
        overallProgress,
        remainingItems,
        progressDetails,
        error,
        currentSettings,
    };
};

export default useSpotifyData;
