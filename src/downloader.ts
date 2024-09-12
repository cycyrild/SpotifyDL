import { SpotifyAPI } from "./spotify-api/spotify-api"
import { DeviceV2Parser, DeviceV2 } from './widevine/device';
import { Buffer, } from 'buffer';
import { Pssh } from './widevine/pssh'
import { Cdm } from './widevine/cdm'
import * as LicenseProtocol from './widevine/license_protocol';
import * as Metadata from "./spotify-api/metadata";
import { TrackMetadata } from "./spotify-api/metadata";
import { FileDownloadData } from "./utils/fetch-helpers"
import * as Helpers from "./utils/helpers"
import * as FetchHelpers from "./utils/fetch-helpers"
import MP4Tool from "./utils/mp4tool";
import { TrackDownloadManager, UIUpdateCallback } from "./utils/download-manager";
import { TrackData } from "./trackdata";
import { AudioFormat, AudioFormatUtil } from "./audioformats";
import { Writer } from "protobufjs/minimal";
import { Settings } from "./utils/userSettings"

const DEVICE_URL = 'device.wvd';

export interface DownloadResult {
  metadata: TrackMetadata;
  data: FileDownloadData<Uint8Array>;
};

class Downloader {

  private mp4Tool?: MP4Tool;
  private device?: DeviceV2;
  private trackDownloadManager: TrackDownloadManager;

  private constructor(uiUpdateCallback: UIUpdateCallback) {

    this.trackDownloadManager = new TrackDownloadManager(uiUpdateCallback);
  }

  private async loadDependencies() {
    const [mp4Tool, deviceBytes] = await Promise.all([
      MP4Tool.create(),
      FetchHelpers.fetchAsBuffer(DEVICE_URL)
    ]);
    this.mp4Tool = mp4Tool;
    this.device = DeviceV2Parser.parse(deviceBytes);
  }

  static async create(uiUpdateCallback: UIUpdateCallback): Promise<Downloader> {
    const downloader = new Downloader(uiUpdateCallback);
    await downloader.loadDependencies();
    return downloader;
  }

  private async DownloadTrack(trackId: string, accessToken: string, settings: Settings): Promise<TrackData> {

    if (!this.device)
      throw new Error(`CDM device not initialized`);

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

    const downloadTrackTask = FetchHelpers.fetchUrlAsFileDataProgress(streamUrl, trackId, this.trackDownloadManager.trackDownloadProgressCallback);
    let downloadCoverTask: Promise<FileDownloadData<Buffer>> | undefined = undefined;

    if (coverUrl) {
      downloadCoverTask = FetchHelpers.fetchUrlAsFileData(coverUrl);
    }

    let key: string | undefined;

    if (AudioFormatUtil.isAAC(settings.format)) {
      const pssh_b64 = await SpotifyAPI.getPsshB64(fileToDownload.file_id, accessToken);

      const pssh_buffer = Buffer.from(pssh_b64, 'base64');;

      const parsedPssh = Pssh.parse(pssh_buffer);

      const cdm = new Cdm();

      const bytesArray = cdm.getLicenseChallenge(this.device, parsedPssh, LicenseProtocol.LicenseType.STREAMING);

      const widevineLicense = await SpotifyAPI.getWidevineLicense(bytesArray, accessToken, settings.retryOptions);

      const parsedKeys = await cdm.parseLicenseAndGetKeys(widevineLicense, this.device);

      if (parsedKeys.length == 0)
        throw new Error(`No keys found by the content decryption module`);

      key = Helpers.toHexString(parsedKeys[0].keyValue);
    }
    else
      throw new Error(`Unsupported audio format ${settings.format}`);


    if (!key)
      throw new Error(`No key found for track ${trackId}`);

    const trackFiledata = await downloadTrackTask;
    const coverFileData = await downloadCoverTask;

    const obj: TrackData = {
      trackFiledata: trackFiledata,
      coverFileData: coverFileData,
      key: key,
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

    const downloadPromises: (() => Promise<string|undefined>)[] = [];

    trackIds.forEach(id => {
      downloadPromises.push(async () => {
        try {
          if (!this.mp4Tool)
            throw new Error(`ffmpeg not initialized`);

          const track = await this.DownloadTrack(id, accessToken, settings);


          const decryptedTrack = await this.mp4Tool.ProcessFiles(track);
          this.trackDownloadManager.decryptionProgressCallback(track.spotifyId);

          const fileDataBuffer: FileDownloadData<Uint8Array> = {
            arrayBuffer: decryptedTrack,
            mimetype: track.trackFiledata.mimetype,
            extension: track.trackFiledata.extension
          };

          const elt: DownloadResult = {
            metadata: track.metadata,
            data: fileDataBuffer
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