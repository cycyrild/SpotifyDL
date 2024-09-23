import { AudioFormat } from "./audioformats";
import { TrackMetadata } from "./spotify-api/metadata";
//import { FileDownloadData } from "./utils/fetch-helpers";

export interface TrackData {
  trackFiledata: Buffer;
  coverFileData: Buffer | undefined;
  ffmpegDecryptionKey?: string;
  aesDecryptionKey?: string;
  metadata: TrackMetadata;
  spotifyId: string;
  audioFormat: AudioFormat
}
