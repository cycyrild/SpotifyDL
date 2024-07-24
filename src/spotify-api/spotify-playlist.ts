export interface Playlist {
    collaborative: boolean;
    description: string | null;
    external_urls: {
      spotify: string;
    };
    followers: {
      href: string | null;
      total: number;
    };
    href: string | null;
    id: string;
    images: ImageObject[];
    name: string;
    owner: Owner;
    public: boolean | null;
    snapshot_id: string;
    tracks: Tracks;
    type: string;
    uri: string;
  }
  
  interface ImageObject {
    url: string;
    height: number | null;
    width: number | null;
  }
  
  interface Owner {
    external_urls: {
      spotify: string;
    };
    followers: {
      href: string | null;
      total: number;
    };
    href: string | null;
    id: string;
    type: "user";
    uri: string;
    display_name: string | null;
  }
  
  interface Tracks {
    href: string;
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
    items: PlaylistTrackObject[];
  }
  
  interface PlaylistTrackObject {
    added_at: string | null;
    added_by: AddedBy;
    is_local: boolean;
    track?: TrackObject | EpisodeObject;
  }
  
  interface AddedBy {
    external_urls: {
      spotify: string;
    };
    followers: {
      href: string | null;
      total: number;
    };
    href: string | null;
    id: string;
    type: "user";
    uri: string;
  }
  
  export interface TrackObject {
    album: Album;
    artists: SimplifiedArtistObject[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: {
      isrc: string;
      ean: string;
      upc: string;
    };
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    is_playable: boolean;
    linked_from?: any;
    restrictions?: {
      reason: string;
    };
    name: string;
    popularity: number;
    preview_url: string | null;
    track_number: number;
    type: "track";
    uri: string;
    is_local: boolean;
  }
  
  interface Album {
    album_type: "album" | "single" | "compilation";
    total_tracks: number;
    available_markets: string[];
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    images: ImageObject[];
    name: string;
    release_date: string;
    release_date_precision: "year" | "month" | "day";
    restrictions?: {
      reason: string;
    };
    type: "album";
    uri: string;
    artists: SimplifiedArtistObject[];
  }
  
  interface SimplifiedArtistObject {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: "artist";
    uri: string;
  }
  
 interface EpisodeObject {
    audio_preview_url: string | null;
    description: string;
    html_description: string;
    duration_ms: number;
    explicit: boolean;
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    images: ImageObject[];
    is_externally_hosted: boolean;
    is_playable: boolean;
    languages: string[];
    name: string;
    release_date: string;
    release_date_precision: "year" | "month" | "day";
    resume_point?: any;
    type: "episode";
    uri: string;
    restrictions?: {
      reason: string;
    };
    show: Show;
  }
  
  interface Show {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    images: ImageObject[];
    name: string;
    publisher: string;
    type: "show";
    uri: string;
  }
  