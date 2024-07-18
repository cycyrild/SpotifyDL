import { useEffect, useState, useRef } from 'react';
import Downloader from '../downloader';
import { SpotifyAuth } from '../spotifyauth';
import * as Helpers from '../utils/helpers';
import { UIUpdateCallback } from '../utils/downloadManager';
import SpotifyAPI from "../spotify-api/spotify-api"
import { SpotifyPlaylist, SpotifyTrack } from "../spotify-api/spotifyPlaylist";

const useSpotifyData = () => {
    const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
    const [tracksTitle, setTracksTitle] = useState<string>("");
    
    const [spotifyAccessToken, setSpotifyAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [overallProgress, setOverallProgress] = useState<number>(100);
    const [remainingItems, setRemainingItems] = useState<number>(0);
    const [progressDetails, setProgressDetails] = useState<{ [id: string]: number }>({});
    const [error, setError] = useState(null);

    const downloadState: UIUpdateCallback = (overallProgress, remainingItems, progressDetails) => {
        setOverallProgress(overallProgress);
        setRemainingItems(remainingItems);
        setProgressDetails(progressDetails);
    };

    const downloaderRef = useRef<Downloader | null>(null);


    function getPlaylistIdFromUrl(url: string): string | null {
        const spotifyPlaylistUrlPattern = /^https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
        const match = url.match(spotifyPlaylistUrlPattern);
        return match ? match[1] : null;
    }



    useEffect(() => {
        const fetchData = async () => {
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                const currentTab = tabs[0];

                if (!currentTab.url) {
                    throw new Error("Unable to retrieve current URL.")
                }

                const playlistId = getPlaylistIdFromUrl(currentTab.url);

                if (!playlistId) {
                    throw new Error("No Spotify playlists detected on this page.")
                }

                let cookie = await SpotifyAuth.getSpotifyCookie();
                if (!cookie) {
                    throw new Error('No Spotify login cookies detected. Please log in.');
                }

                downloaderRef.current = new Downloader(downloadState);
                const downloaderLoadTask = downloaderRef.current.Load();

                const token = await SpotifyAuth.getAccessToken(cookie);
                setSpotifyAccessToken(token);

                const playlistTracks = await SpotifyAPI.getAllTracksFromPlaylist(playlistId, token);

                await downloaderLoadTask;
                setTracks(playlistTracks[0]);
                setTracksTitle(playlistTracks[1]);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setError(error.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { tracks, tracksTitle, spotifyAccessToken, loading, downloaderRef, overallProgress, remainingItems, progressDetails, error };
};

export default useSpotifyData;
