// Interface for Spotify Image
export interface SpotifyImage {
    url: string;
    height: number;
    width: number;
}

// Interface for Spotify External URL
export interface SpotifyExternalURL {
    spotify: string;
}

// Interface for Spotify Followers
export interface SpotifyFollowers {
    href: string | null;
    total: number;
}

// Interface for Spotify Owner
export interface SpotifyOwner {
    external_urls: SpotifyExternalURL;
    followers: SpotifyFollowers;
    href: string;
    id: string;
    type: string;
    uri: string;
    display_name: string;
}

// Interface for Spotify Track
export interface SpotifyTrack {
    album: {
        album_type: string;
        total_tracks: number;
        available_markets: string[];
        external_urls: SpotifyExternalURL;
        href: string;
        id: string;
        images: SpotifyImage[];
        name: string;
        release_date: string;
        release_date_precision: string;
        restrictions?: {
            reason: string;
        };
        type: string;
        uri: string;
        artists: {
            external_urls: SpotifyExternalURL;
            href: string;
            id: string;
            name: string;
            type: string;
            uri: string;
        }[];
    };
    artists: {
        external_urls: SpotifyExternalURL;
        href: string;
        id: string;
        name: string;
        type: string;
        uri: string;
    }[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: {
        isrc: string;
        ean?: string;
        upc?: string;
    };
    external_urls: SpotifyExternalURL;
    href: string;
    id: string;
    is_playable: boolean;
    linked_from?: object;
    restrictions?: {
        reason: string;
    };
    name: string;
    popularity: number;
    preview_url: string | null;
    track_number: number;
    type: string;
    uri: string;
    is_local: boolean;
}

// Interface for Spotify Playlist Track
export interface SpotifyPlaylistTrack {
    added_at: string;
    added_by: {
        external_urls: SpotifyExternalURL;
        followers: SpotifyFollowers;
        href: string;
        id: string;
        type: string;
        uri: string;
    };
    is_local: boolean;
    track: SpotifyTrack;
}

// Interface for Spotify Playlist Tracks
export interface SpotifyPlaylistTracks {
    href: string;
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
    items: SpotifyPlaylistTrack[];
}

// Interface for Spotify Playlist
export interface SpotifyPlaylist {
    collaborative: boolean;
    description: string;
    external_urls: SpotifyExternalURL;
    followers: SpotifyFollowers;
    href: string;
    id: string;
    images: SpotifyImage[];
    name: string;
    owner: SpotifyOwner;
    public: boolean;
    snapshot_id: string;
    tracks: SpotifyPlaylistTracks;
    type: string;
    uri: string;
}