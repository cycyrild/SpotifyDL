import { AudioFormat } from "./audioformats";
import { TrackMetadata } from "./spotify-api/metadata";
import { FileDownloadData } from "./utils/helpers";

export interface TrackData {
  trackFiledata: FileDownloadData<Buffer>;
  coverFileData: FileDownloadData<Buffer> | undefined;
  key: string;
  metadata: TrackMetadata;
  spotifyId: string;
  audioFormat: AudioFormat
}
