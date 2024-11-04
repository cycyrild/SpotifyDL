import { useEffect, useState, useRef, useCallback } from 'react';
import { Downloader } from '../downloader';
import { getAccessToken } from '../spotifyauth';
import { UIUpdateCallback, FileProgressState } from '../utils/download-manager';
import {SpotifyAPI} from "../spotify-api/spotify-api";
import { TracksCommonFields, MediaType } from '../spotify-api/interfaces';
import * as userSettings from '../utils/userSettings';
import { MEDIA_ID_URL_ARG, MEDIA_TYPE_URL_ARG } from '../utils';

const useSpotifyData = () => {
    const [tracksCommonFields, setTracksCommonFields] = useState<TracksCommonFields>();
    const [loading, setLoading] = useState<boolean>(true);
    const [overallProgress, setOverallProgress] = useState<number>(0);
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

  
    const fetchData = async () => {
        try {
            const params = new URLSearchParams(window.location.search);

            const mediaType = params.get(MEDIA_TYPE_URL_ARG);
            const mediaId = params.get(MEDIA_ID_URL_ARG);

            if (!mediaType || !mediaId) {
                throw new Error(`No ${Object.values(MediaType).join(', ')} Spotify currently opened in this tab.\nPlease open one then reopen the extension.`);
            }

            const settings = await userSettings.loadSettings();
            currentSettings.current = settings;

            const token = await getAccessToken();


            if(!token || !token.accessToken) {
                throw new Error("Please log in to Spotify to use this extension.");
            }

            spotifyAccessToken.current = token.accessToken;

            const downloaderLoadTask = Downloader.Create(downloadState, currentSettings, spotifyAccessToken);

            let tracksCommonFields: TracksCommonFields;

            switch (mediaType) {
                case MediaType.Album:
                    tracksCommonFields = await SpotifyAPI.getAllTracksFromAlbum(mediaId, spotifyAccessToken.current);
                    break;
                case MediaType.Playlist:
                    tracksCommonFields = await SpotifyAPI.getAllTracksFromPlaylist(mediaId, spotifyAccessToken.current);
                    break;
                case MediaType.Track:
                    tracksCommonFields = await SpotifyAPI.getTrack(mediaId, spotifyAccessToken.current);
                    break;

                default:
                    throw new Error(`Unsupported media type: ${mediaId}`);
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
