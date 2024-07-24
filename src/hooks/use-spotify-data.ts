import { useEffect, useState, useRef, useCallback } from 'react';
import Downloader from '../downloader';
import { SpotifyAuth } from '../spotifyauth';
import * as Helpers from '../utils/helpers';
import { UIUpdateCallback, FileProgressStateImpl } from '../utils/download-manager';
import SpotifyAPI from "../spotify-api/spotify-api";
import { TrackObject, CommonFields, MediaType } from "../spotify-api/spotify-types";
import { TracksCommonFields } from '../spotify-api/interfaces';

const useSpotifyData = () => {
    const [tracksCommonFields, setTracksCommonFields] = useState<TracksCommonFields | undefined>();
    const [loading, setLoading] = useState<boolean>(true);
    const [overallProgress, setOverallProgress] = useState<number>(100);
    const [remainingItems, setRemainingItems] = useState<number>(0);
    const [progressDetails, setProgressDetails] = useState<{ [id: string]: FileProgressStateImpl }>({});

    const [error, setError] = useState<string | null>(null);
    const spotifyAccessToken = useRef<string | null>(null);
    const downloaderRef = useRef<Downloader | null>(null);

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
        const spotifyUrlPattern = new RegExp(`^https:\/\/open\\.spotify\\.com\\/(${mediaTypes})\\/([a-zA-Z0-9]+)`);
        const match = url.match(spotifyUrlPattern);

        if (match) {
            const mediaType = match[1] as MediaType;
            const id = match[2];
            return [mediaType, id];
        }

    };

    const fetchData = async () => {
        try {

            const params = new URLSearchParams(window.location.search);
            const url = params.get('url');
            if (!url) {
                throw new Error("Unable to retrieve current URL.");
            }

            downloaderRef.current = new Downloader(downloadState);
            const downloaderLoadTask = downloaderRef.current.Load();

            const token = await SpotifyAuth.getAccessToken();
            spotifyAccessToken.current = token.accessToken;

            const medias = getIdFromUrl(url);

            if(!medias)
            {
                throw new Error(`No ${Object.values(MediaType).join(', ')} Spotify currently opened in this tab.\nPlease open one then reopen the extension.`);
            }

            const tracksCommonFields = await SpotifyAPI.getAllTracksFromMedia(medias[1], token.accessToken, medias[0]);

            await downloaderLoadTask;
            setTracksCommonFields(tracksCommonFields);
            setLoading(false);
        } catch (error) {
            const normalizedError = normalizeError(error);
            console.error(normalizedError.message);
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
    };
};

export default useSpotifyData;
