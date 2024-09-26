import { AudioFormat } from "./audioformats";
import { TrackMetadata } from "./spotify-api/metadata";
//import { FileDownloadData } from "./utils/fetch-helpers";

export interface TrackData {
  trackFiledata: Buffer;
  coverFileData?: Buffer;
  decryptionKey: DecryptionKey;
  metadata: TrackMetadata;
  spotifyId: string;
  audioFormat: AudioFormat;
}

export type DecryptionKey = FFMpegDecryptionKey | AESDecryptionKey;

export interface FFMpegDecryptionKey {
  type: "ffmpeg";
  key: string;
}

export interface AESDecryptionKey {
  type: "aes";
  key: string;
}
