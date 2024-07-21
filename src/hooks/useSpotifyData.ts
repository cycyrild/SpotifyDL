import { useEffect, useState, useRef, useCallback } from 'react';
import Downloader from '../downloader';
import { SpotifyAuth } from '../spotifyauth';
import * as Helpers from '../utils/helpers';
import { UIUpdateCallback, FileProgressStateImpl } from '../utils/downloadManager';
import SpotifyAPI from "../spotify-api/spotify-api";
import { SpotifyPlaylist, SpotifyTrack } from "../spotify-api/spotifyPlaylist";

const useSpotifyData = () => {
    const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
    const [tracksTitle, setTracksTitle] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [overallProgress, setOverallProgress] = useState<number>(100);
    const [remainingItems, setRemainingItems] = useState<number>(0);
    const [progressDetails, setProgressDetails] = useState<{ [id: string]: FileProgressStateImpl }>({});

    const [error, setError] = useState<string | null>(null);
    const spotifyAccessToken = useRef<string | null>(null);
    const downloaderRef = useRef<Downloader | null>(null);

    const normalizeError = (err:any) => {
        if (err instanceof Error) {
          return err;
        } else if (typeof err === 'string') {
          return new Error(err);
        } else {
          return new Error('Une erreur inconnue s\'est produite');
        }
      }

    const downloadState = useCallback<UIUpdateCallback>((overallProgress, remainingItems, progressDetails) => {
        setOverallProgress(overallProgress);
        setRemainingItems(remainingItems);
        setProgressDetails(progressDetails);
    }, []);

    const getPlaylistIdFromUrl = useCallback((url: string): string | null => {
        const spotifyPlaylistUrlPattern = /^https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
        const match = url.match(spotifyPlaylistUrlPattern);
        return match ? match[1] : null;
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {

                const params = new URLSearchParams(window.location.search);
                const url = params.get('url');
                if (!url) {
                    throw new Error("Unable to retrieve current URL.");
                }

                const playlistId = getPlaylistIdFromUrl(url);

                if (!playlistId) {
                    throw new Error("No Spotify playlists detected on this page.");
                }

                downloaderRef.current = new Downloader(downloadState);
                const downloaderLoadTask = downloaderRef.current.Load();

                const token = await SpotifyAuth.getAccessToken();
                spotifyAccessToken.current = token.accessToken;

                const [playlistTracks, playlistTitle] = await SpotifyAPI.getAllTracksFromPlaylist(playlistId, token.accessToken);

                await downloaderLoadTask;
                setTracks(playlistTracks);
                setTracksTitle(playlistTitle);
                setLoading(false);
            } catch (error) {
                const normalizedError = normalizeError(error);
                console.error(normalizedError.message);
                setError(normalizedError.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [getPlaylistIdFromUrl, downloadState]);

    return {
        tracks,
        tracksTitle,
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
