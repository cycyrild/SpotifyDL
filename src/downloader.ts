import { SpotifyAPI } from "./spotify-api/spotify-api"
import { DeviceV2 } from './widevine/device';
import { Buffer, } from 'buffer';
import * as Metadata from "./spotify-api/metadata";
import { TrackMetadata } from "./spotify-api/metadata";
import * as FetchHelpers from "./utils/fetch-helpers"
import FFMPEGTool from "./utils/ffmpegtool";
import { TrackDownloadManager, UIUpdateCallback } from "./utils/download-manager";
import { TrackData } from "./trackdata";
import { AudioFormatUtil } from "./audioformats";
import { Settings } from "./utils/userSettings"
import * as PlayPlayHelper from "./playplay_helper"
import * as WidevineHelper from "./widevine_helper"

import { PlayPlayDecrypt } from "./playplay/playplayDecrypt";
import * as Helpers from "./utils/helpers"
import * as Ogg from "./audiofix/ogg"

const DEVICE_URL = 'device.wvd';

export interface DownloadResult {
  metadata: TrackMetadata;
  data: Uint8Array;
  extension: string;
};

class Downloader {

  private ffmpegTool?: FFMPEGTool;
  private device?: DeviceV2;
  private trackDownloadManager: TrackDownloadManager;
  private playplayDecrypt?: PlayPlayDecrypt;


  private constructor(uiUpdateCallback: UIUpdateCallback) {

    this.trackDownloadManager = new TrackDownloadManager(uiUpdateCallback);
  }

  private async loadDependencies() {
    const [ffmpegTool, deviceBytes, playplayDecrypt] = await Promise.all([
      FFMPEGTool.create(),
      FetchHelpers.fetchAsBuffer(DEVICE_URL),
      PlayPlayDecrypt.load()
    ]);
    this.ffmpegTool = ffmpegTool;
    this.device = DeviceV2.parse(deviceBytes);
    this.playplayDecrypt = playplayDecrypt;
  }

  static async Create(uiUpdateCallback: UIUpdateCallback): Promise<Downloader> {
    const downloader = new Downloader(uiUpdateCallback);
    await downloader.loadDependencies();
    return downloader;
  }

  private async DownloadTrack(trackId: string, accessToken: string, settings: Settings): Promise<TrackData> {

    const gid = SpotifyAPI.getTrackGid(trackId);

    const metadata = await SpotifyAPI.getGidMetadata(gid, accessToken)

    let file: Metadata.File[];
    if (metadata.file) {
      file = metadata.file;
    } else if (metadata.alternative && metadata.alternative[0] && metadata.alternative[0].file) {
      file = metadata.alternative[0].file;
    }
    else {
      throw new Error("No download files found");
    }

    const fileToDownload = file.find(x => x.format === settings.format);

    if (!fileToDownload)
      throw new Error(`No files to download in format ${settings.format}`);

    const streamUrl = await SpotifyAPI.getStreamUrl(fileToDownload.file_id, accessToken);
    const coverUrl = await SpotifyAPI.getCoverUrl(metadata, Metadata.ImageSize.DEFAULT);

    let downloadTrackTask: Promise<Buffer> | undefined = undefined;
    let downloadCoverTask: Promise<Buffer> | undefined = undefined;

    if (coverUrl) {
      downloadCoverTask = FetchHelpers.fetchAsBuffer(coverUrl);
    }

    let ffmpegDecryptionKey: string | undefined;
    let aesDecryptionKey: string | undefined;

    if (AudioFormatUtil.isAAC(settings.format)) {
      if (!this.device)
        throw new Error(`Widevine device not initialized`);
      downloadTrackTask = FetchHelpers.fetchAsBufferProgress(streamUrl, trackId, this.trackDownloadManager.trackDownloadProgressCallback);
      ffmpegDecryptionKey = await WidevineHelper.getKey(fileToDownload.file_id, accessToken, this.device, settings.retryOptions);
    }
    else if (AudioFormatUtil.isVorbis(settings.format)) {
      if (!this.playplayDecrypt)
        throw new Error(`PlayPlay decrypt not initialized`);
      downloadTrackTask = FetchHelpers.fetchAsBufferProgress(streamUrl, trackId, this.trackDownloadManager.trackDownloadProgressCallback);
      aesDecryptionKey = await PlayPlayHelper.getKey(fileToDownload.file_id, accessToken, this.playplayDecrypt, settings.retryOptions);
    }
    else
      throw new Error(`Unsupported audio format ${settings.format}`);


    const trackFiledata = await downloadTrackTask;
    const coverFileData = await downloadCoverTask;

    const obj: TrackData = {
      trackFiledata: trackFiledata,
      coverFileData: coverFileData,
      ffmpegDecryptionKey: ffmpegDecryptionKey,
      aesDecryptionKey: aesDecryptionKey,
      metadata: metadata,
      spotifyId: trackId,
      audioFormat: settings.format
    };
    return obj;
  }


  async DownloadTrackAndDecrypt(trackIds: Set<string>, accessToken: string, settings: Settings, saveCallback: (result: DownloadResult) => void): Promise<void> {

    trackIds.forEach(id => {
      this.trackDownloadManager.initializeFile(id);
    });

    const downloadPromises: (() => Promise<string | undefined>)[] = [];

    trackIds.forEach(id => {
      downloadPromises.push(async () => {
        try {
          if (!this.ffmpegTool)
            throw new Error(`ffmpeg not initialized`);

          const track = await this.DownloadTrack(id, accessToken, settings);

          if (!track.aesDecryptionKey && !track.ffmpegDecryptionKey)
            throw new Error(`No decryption key found`);

          if (track.aesDecryptionKey)
            track.trackFiledata = await PlayPlayHelper.decipherData(track.trackFiledata, track.aesDecryptionKey);

          if (AudioFormatUtil.isVorbis(settings.format))
            Ogg.rebuildOgg(track.trackFiledata);

          const decryptedTrack = await this.ffmpegTool.ProcessFiles(track, settings.outputAudioContainer);
          this.trackDownloadManager.encodingProgressCallback(track.spotifyId);

          const elt: DownloadResult = {
            metadata: track.metadata,
            data: decryptedTrack,
            extension: settings.outputAudioContainer
          }

          saveCallback(elt);

          this.trackDownloadManager.saveProgressCallback(track.spotifyId);

          return track.spotifyId;

        }
        catch (e) {
          console.error(`Error downloading track ${id}: ${e}`);
          this.trackDownloadManager.errorProgressCallback(id);
        }

        return undefined;
      });
    });

    const downloadedTracks = await Helpers.limitedPromiseAll(downloadPromises, settings.maxDownloadConcurency);

    downloadedTracks.forEach(id => {
      if (id) {
        this.trackDownloadManager.finishedCallback(id);
      }
    });

  }
}
export default Downloader;