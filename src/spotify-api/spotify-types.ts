interface ExternalUrls {
  spotify: string;
}

interface Followers {
  href: string | null;
  total: number;
}

export interface ImageObject {
  url: string;
  height: number | null;
  width: number | null;
}

interface SimplifiedArtistObject {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  type: "artist";
  uri: string;
}

export interface TrackObject {
  album?: Album;
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
  external_urls: ExternalUrls;
  href: string;
  id: string;
  is_playable: boolean;
  linked_from?: any;
  restrictions?: {
    reason: RestrictionReason;
  };
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: "track";
  uri: string;
  is_local: boolean;
}

interface AddedBy {
  external_urls: ExternalUrls;
  followers: Followers;
  href: string | null;
  id: string;
  type: "user";
  uri: string;
}

enum ReleaseDatePrecision {
  Year = "year",
  Month = "month",
  Day = "day"
}

enum RestrictionReason {
  Market = "market",
  Product = "product",
  Explicit = "explicit"
}

interface EpisodeObject {
  audio_preview_url: string | null;
  description: string;
  html_description: string;
  duration_ms: number;
  explicit: boolean;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: ImageObject[];
  is_externally_hosted: boolean;
  is_playable: boolean;
  languages: string[];
  name: string;
  release_date: string;
  release_date_precision: ReleaseDatePrecision;
  resume_point?: any;
  type: "episode";
  uri: string;
  restrictions?: {
    reason: RestrictionReason;
  };
  show: Show;
}

interface Show {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: ImageObject[];
  name: string;
  publisher: string;
  type: "show";
  uri: string;
}

interface CopyrightObject {
  text: string;
  type: string;
}

interface ExternalIds {
  isrc?: string;
  ean?: string;
  upc?: string;
}

interface Tracks {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

interface AlbumTracks extends Tracks {
  items: TrackObject[];
}

interface PlaylistTracks extends Tracks {
  items: PlaylistTrackObject[];
}

export interface PlaylistTrackObject {
  added_at: string | null;
  added_by: AddedBy;
  is_local: boolean;
  track?: TrackObject | EpisodeObject;
}

export enum MediaType {
  Playlist = "playlist",
  Album = "album"
}

export interface CommonFields {
  available_markets: string[];
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: ImageObject[];
  name: string;
  restrictions?: {
    reason: RestrictionReason;
  };
  type: MediaType;
  uri: string;
}

export enum AlbumType {
  Album = "album",
  Single = "single",
  Compilation = "compilation"
}

export interface Album extends CommonFields {
  album_type: AlbumType;
  total_tracks: number;
  artists: SimplifiedArtistObject[];
  tracks?: AlbumTracks;
  copyrights?: CopyrightObject[];
  external_ids?: ExternalIds;
  genres?: string[];
  label?: string;
  popularity?: number;
  release_date: string;
  release_date_precision: ReleaseDatePrecision;
}

interface Owner extends AddedBy {
  display_name: string | null;
}

export interface Playlist extends CommonFields {
  collaborative: boolean;
  description: string | null;
  followers: Followers;
  owner: Owner;
  public: boolean | null;
  snapshot_id: string;
  tracks: PlaylistTracks;
}
