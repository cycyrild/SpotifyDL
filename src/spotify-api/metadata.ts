export interface TrackMetadata {
  gid: string;
  name: string;
  album: Album;
  artist: Artist[];
  number: number;
  disc_number: number;
  duration: number;
  popularity: number;
  external_id: ExternalId[];
  restriction?: Restriction[];
  alternative?: Alternative[];
  earliest_live_timestamp: number;
  has_lyrics?: boolean;
  licensor: Licensor;
  language_of_performance: string[];
  original_audio: OriginalAudio;
  original_title: string;
  artist_with_role: ArtistWithRole[];
  canonical_uri: string;
  file?: File[];
  preview?: Preview[];
  version_title?: string;
}


export interface Album {
  gid: string
  name: string
  artist: Artist[]
  label: string
  date: DateMetadata
  cover_group: CoverGroup
  licensor: Licensor
}

export interface Artist {
  gid: string
  name: string
}

export interface DateMetadata {
  year: number
  month: number
  day: number
}

export interface CoverGroup {
  image: Image[]
}

export interface Image {
  file_id: string
  size: ImageSize
  width: number
  height: number
}

export enum ImageSize {
  DEFAULT = "DEFAULT",
  SMALL = "SMALL",
  LARGE = "LARGE"
}
export interface Licensor {
  uuid: string
}

export interface ExternalId {
  type: string
  id: string
}

export interface Restriction {
  countries_allowed: string
}

export interface Alternative {
  gid: string
  file: File[]
  preview: Preview[]
  original_audio: OriginalAudio
}

export interface File {
  file_id: string
  format: string
}

export interface Preview {
  file_id: string
  format: string
}

export interface OriginalAudio {
  uuid: string
}

export interface ArtistWithRole {
  artist_gid: string
  artist_name: string
  role: string
}
