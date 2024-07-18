import { TrackMetadata } from "./spotify-api/metadata";
import { FileDownloadData } from "./utils/helpers";

export interface TrackData {
  trackFiledata: FileDownloadData;
  coverFileData: FileDownloadData | undefined;
  key: string;
  metadata: TrackMetadata;
  spotifyId: string;
}
