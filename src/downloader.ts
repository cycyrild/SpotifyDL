import { SpotifyAPI } from "./spotify-api/spotify-api"
import { DeviceV2 } from './widevine/device';
import { Buffer, } from 'buffer';
import { TrackMetadata } from "./spotify-api/metadata";
import { FFMPEGTool } from "./utils/ffmpegtool";
import { TrackDownloadManager, UIUpdateCallback } from "./utils/download-manager";
import { DecryptionKey, TrackData } from "./trackdata";
import { AudioFormatUtil } from "./audioformats";
import { Settings } from "./utils/userSettings"
import { DownloadQueue } from "./utils/download-queue"
import { PlayPlayDecrypt } from "./playplay/playplayDecrypt";
import * as PlayPlayHelper from "./playplay_helper"
import * as WidevineHelper from "./widevine_helper"
import * as FetchHelpers from "./utils/fetch-helpers"
import * as Metadata from "./spotify-api/metadata";
import * as Ogg from "./audiofix/ogg"

const DEVICE_URL = 'device.wvd';

export interface DownloadResult {
  metadata: TrackMetadata;
  data: Uint8Array;
  extension: string;
};

export class Downloader {

  private ffmpegTool?: FFMPEGTool;
  private device?: DeviceV2;
  private trackDownloadManager: TrackDownloadManager;
  private playplayDecrypt?: PlayPlayDecrypt;
  private downloadQueue: DownloadQueue<string|undefined>;
  private settings: React.MutableRefObject<Settings>;
  private accessToken: React.MutableRefObject<string>;

  private constructor(uiUpdateCallback: UIUpdateCallback, settings: React.MutableRefObject<Settings>, accessToken: React.MutableRefObject<string>) {

    this.trackDownloadManager = new TrackDownloadManager(uiUpdateCallback);
    this.downloadQueue = new DownloadQueue<string|undefined>(settings);
    this.settings = settings;
    this.accessToken = accessToken;
  }

  public static async Create(uiUpdateCallback: UIUpdateCallback, settings: React.MutableRefObject<Settings>, accessToken: React.MutableRefObject<string>): Promise<Downloader> {
    const downloader = new Downloader(uiUpdateCallback, settings, accessToken);
    await downloader.loadDependencies();
    return downloader;
  }

  private async loadDependencies() {
    const [ffmpegTool, deviceBytes, playplayDecrypt] = await Promise.all([
      FFMPEGTool.Create(),
      FetchHelpers.fetchAsBuffer(DEVICE_URL),
      PlayPlayDecrypt.Create()
    ]);
    this.ffmpegTool = ffmpegTool;
    this.device = DeviceV2.parse(deviceBytes);
    this.playplayDecrypt = playplayDecrypt;
  }

  private async downloadTrack(trackId: string): Promise<TrackData> {

    const gid = SpotifyAPI.getTrackGid(trackId);

    const metadata = await SpotifyAPI.getGidMetadata(gid, this.accessToken.current);

    let file: Metadata.File[];
    if (metadata.file) {
      file = metadata.file;
    } else if (metadata.alternative && metadata.alternative[0] && metadata.alternative[0].file) {
      file = metadata.alternative[0].file;
    }
    else {
      throw new Error("No download files found");
    }

    const fileToDownload = file.find(x => x.format === this.settings.current.format);

    if (!fileToDownload)
      throw new Error(`No files to download in format ${this.settings.current.format}`);

    const streamUrl = await SpotifyAPI.getStreamUrl(fileToDownload.file_id, this.accessToken.current);
    const coverUrl = await SpotifyAPI.getCoverUrl(metadata, Metadata.ImageSize.DEFAULT);

    let downloadTrackTask: Promise<Buffer> | undefined = undefined;
    let downloadCoverTask: Promise<Buffer> | undefined = undefined;

    if (coverUrl) {
      downloadCoverTask = FetchHelpers.fetchAsBuffer(coverUrl);
    }

    let decryptionKey: DecryptionKey | undefined;

    if (AudioFormatUtil.isAAC(this.settings.current.format)) {
      if (!this.device)
        throw new Error(`Widevine device not initialized`);
      downloadTrackTask = FetchHelpers.fetchAsBufferProgress(streamUrl, trackId, this.trackDownloadManager.trackDownloadProgressCallback);
      
      const ffmpegDecryptionKey = await WidevineHelper.getKey(fileToDownload.file_id, this.accessToken.current, this.device, this.settings.current.retryOptions);
      decryptionKey = {
        type: "ffmpeg",
        key: ffmpegDecryptionKey
      };
    }
    else if (AudioFormatUtil.isVorbis(this.settings.current.format)) {
      if (!this.playplayDecrypt)
        throw new Error(`PlayPlay decrypt not initialized`);
      downloadTrackTask = FetchHelpers.fetchAsBufferProgress(streamUrl, trackId, this.trackDownloadManager.trackDownloadProgressCallback);
      
      const aesDecryptionKey = await PlayPlayHelper.getKey(fileToDownload.file_id, this.accessToken.current, this.playplayDecrypt, this.settings.current.retryOptions);
      decryptionKey = {
        type: "aes",
        key: aesDecryptionKey
      };
    }
    else
      throw new Error(`Unsupported audio format ${this.settings.current.format}`);


    const trackFiledata = await downloadTrackTask;
    const coverFileData = await downloadCoverTask;

    if (!decryptionKey) {
      throw new Error(`No decryption key found`);
    }

    const obj: TrackData = {
      trackFiledata: trackFiledata,
      coverFileData: coverFileData,
      decryptionKey: decryptionKey,
      metadata: metadata,
      spotifyId: trackId,
      audioFormat: this.settings.current.format
    };
    return obj;
  }

  private async postProcessTrack(id: string, saveCallback: (result: DownloadResult) => void) {
    try {
      if (!this.ffmpegTool) {
        throw new Error(`ffmpeg not initialized`);
      }

      const track = await this.downloadTrack(id);

      if (track.decryptionKey.type === "aes")
        track.trackFiledata = await PlayPlayHelper.decipherData(track.trackFiledata, track.decryptionKey.key);

      if (AudioFormatUtil.isVorbis(this.settings.current.format))
        Ogg.rebuildOgg(track.trackFiledata);

      const decryptedTrack = await this.ffmpegTool.ProcessFiles(track, this.settings.current.outputAudioContainer);
      this.trackDownloadManager.encodingProgressCallback(track.spotifyId);

      const elt: DownloadResult = {
        metadata: track.metadata,
        data: decryptedTrack,
        extension: this.settings.current.outputAudioContainer
      };

      saveCallback(elt);

      this.trackDownloadManager.saveProgressCallback(track.spotifyId);

      return track.spotifyId;
    } catch (e) {
      console.error(`Error downloading track ${id}`, e);
      this.trackDownloadManager.errorProgressCallback(id);
    }
  }


  public async DownloadTracksAndDecrypt(trackIds: Set<string>, saveCallback: (result: DownloadResult) => void): Promise<void> {

    this.trackDownloadManager.initializeFiles(trackIds);

    const downloadTasks = Array.from(trackIds, id => async () => this.postProcessTrack(id, saveCallback));

    this.downloadQueue.addTasks(downloadTasks).then((e) => {

      e.forEach((id) => {

        if(id)
          this.trackDownloadManager.finishedCallback(id);
      });
    });

  }
}
