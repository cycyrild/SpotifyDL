// Enums
enum AlbumGroup {
  ALBUM = "album",
  SINGLE = "single",
  COMPILATION = "compilation",
  APPEARS_ON = "appears_on"
}

enum AlbumType {
  ALBUM = "album",
  SINGLE = "single",
  COMPILATION = "compilation"
}

enum ReleaseDatePrecision {
  YEAR = "year",
  MONTH = "month",
  DAY = "day"
}

enum PlaylistType {
  PLAYLIST = "playlist"
}

enum TrackType {
  TRACK = "track"
}

// Context Object
interface ContextObject {
  type: "artist" | "playlist" | "album" | "show" | "episode";
  href: string;
  external_urls: ExternalUrlObject;
  uri: string;
}

// External Url Object
interface ExternalUrlObject {
  spotify: string;
}

// Image Object
interface ImageObject {
  height?: number | undefined;
  url: string;
  width?: number | undefined;
}

// Restrictions Object
interface RestrictionsObject {
  reason: string;
}

// User Objects
interface UserObjectPublic {
  display_name?: string | undefined;
  external_urls: ExternalUrlObject;
  followers?: FollowersObject | undefined;
  href: string;
  id: string;
  images?: ImageObject[] | undefined;
  type: "user";
  uri: string;
}

interface FollowersObject {
  href: null;
  total: number;
}

// Paging Objects
interface PagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

interface CursorBasedPagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  cursors: CursorObject;
  total?: number | undefined;
}

interface CursorObject {
  after: string;
  before?: string | undefined;
}

// Playlists
interface PlaylistBaseObject extends ContextObject {
  collaborative: boolean;
  description: string | null;
  id: string;
  images: ImageObject[];
  name: string;
  owner: UserObjectPublic;
  public: boolean | null;
  snapshot_id: string;
  type: PlaylistType;
}

interface PlaylistObjectFull extends PlaylistBaseObject {
  followers: FollowersObject;
  tracks: PagingObject<PlaylistTrackObject>;
}

interface PlaylistObjectSimplified extends PlaylistBaseObject {
  tracks: {
      href: string;
      total: number;
  };
}

interface PlaylistTrackObject {
  added_at: string;
  added_by: UserObjectPublic;
  is_local: boolean;
  track: TrackObjectFull | null;
}

interface ListOfUsersPlaylistsResponse extends PagingObject<PlaylistObjectSimplified> {}

interface ListOfCurrentUsersPlaylistsResponse extends PagingObject<PlaylistObjectSimplified> {}

// Albums
interface AlbumObjectFull extends AlbumObjectSimplified {
  copyrights: CopyrightObject[];
  external_ids: ExternalIdObject;
  genres: string[];
  label: string;
  popularity: number;
  tracks: PagingObject<TrackObjectSimplified>;
}

interface AlbumObjectSimplified extends ContextObject {
  album_group?: AlbumGroup | undefined;
  album_type: AlbumType;
  artists: ArtistObjectSimplified[];
  available_markets?: string[] | undefined;
  id: string;
  images: ImageObject[];
  name: string;
  release_date: string;
  release_date_precision: ReleaseDatePrecision;
  restrictions?: RestrictionsObject | undefined;
  type: "album";
  total_tracks: number;
}

interface SingleAlbumResponse extends AlbumObjectFull {}

interface MultipleAlbumsResponse {
  albums: AlbumObjectFull[];
}

interface AlbumTracksResponse extends PagingObject<TrackObjectSimplified> {}

// Tracks
export interface TrackObjectFull extends TrackObjectSimplified {
  album: AlbumObjectSimplified;
  external_ids: ExternalIdObject;
  popularity: number;
  is_local?: boolean | undefined;
}

interface TrackObjectSimplified {
  artists: ArtistObjectSimplified[];
  available_markets?: string[] | undefined;
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_urls: ExternalUrlObject;
  href: string;
  id: string;
  is_playable?: boolean | undefined;
  linked_from?: TrackLinkObject | undefined;
  restrictions?: RestrictionsObject | undefined;
  name: string;
  preview_url: string | null;
  track_number: number;
  type: TrackType;
  uri: string;
}

interface SingleTrackResponse extends TrackObjectFull {}

interface MultipleTracksResponse {
  tracks: TrackObjectFull[];
}

interface SavedTrackObject {
  added_at: string;
  track: TrackObjectFull;
}

interface UsersSavedTracksResponse extends PagingObject<SavedTrackObject> {}

interface RecommendationsFromSeedsResponse extends RecommendationsObject {}

// Additional supporting interfaces
interface CopyrightObject {
  text: string;
  type: "C" | "P";
}

interface ExternalIdObject {
  isrc?: string | undefined;
  ean?: string | undefined;
  upc?: string | undefined;
}

interface ArtistObjectSimplified extends ContextObject {
  name: string;
  id: string;
  type: "artist";
}

interface TrackLinkObject {
  external_urls: ExternalUrlObject;
  href: string;
  id: string;
  type: "track";
  uri: string;
}

interface RecommendationsObject {
  seeds: RecommendationsSeedObject[];
  tracks: RecommendationTrackObject[];
}

interface RecommendationsSeedObject {
  afterFilteringSize: number;
  afterRelinkingSize: number;
  href: string;
  id: string;
  initialPoolSize: number;
  type: "artist" | "track" | "genre";
}

interface RecommendationTrackObject extends Omit<TrackObjectFull, "album"> {
  album: RecommendationAlbumObject;
}

interface RecommendationAlbumObject extends Omit<AlbumObjectSimplified, "album_type"> {
  album_type: "ALBUM" | "SINGLE" | "COMPILATION";
}

// Export interfaces
export {
  PlaylistObjectFull,
  AlbumObjectFull,
  PagingObject,
  PlaylistTrackObject,
  TrackObjectSimplified,
  ImageObject
};
