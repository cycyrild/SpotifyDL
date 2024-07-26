import { TrackObjectSimplified, TrackObjectFull } from "./spotify-types";
import { ImageObject } from "./spotify-types";

export interface TracksCommonFields {
  tracks: TrackObjectSimplified[] | TrackObjectFull[];
  commonFields: CommonFields;
}

export enum MediaType {
  Album = 'album',
  Playlist = 'playlist',
  Track = 'track',
}

export interface CommonFields {
  name: string;
  type: MediaType;
  images: ImageObject[];
}