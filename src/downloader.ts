import SpotifyAPI from "./spotify-api/spotify-api"
import { DeviceV2Parser, DeviceV2 } from './widevine/device';
import { Buffer, } from 'buffer';
import { Pssh } from './widevine/pssh'
import { Cdm } from './widevine/cdm'
import * as LicenseProtocol from './widevine/license_protocol';
import * as Metadata from "./spotify-api/metadata";
import { TrackMetadata } from "./spotify-api/metadata";
import { FileDownloadData } from "./utils/helpers"
import * as Helpers from "./utils/helpers"
import MP4Tool from "./utils/mp4tool";
import { TrackDownloadManager, UIUpdateCallback } from "./utils/download-manager";
import { TrackData } from "./trackdata";
import { AudioFormat, AudioFormatUtil } from "./audioformats";
import { ContentType, Interactivity, PlayPlayLicenseRequest, PlayPlayLicenseResponse } from "./playplay/playplay";
import { Writer } from "protobufjs/minimal";

const DEVICE_URL = 'device.bin';

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
      Helpers.fetchAsBuffer(DEVICE_URL)
    ]);
    this.mp4Tool = mp4Tool;
    this.device = DeviceV2Parser.parse(deviceBytes);
  }

  static async create(uiUpdateCallback: UIUpdateCallback): Promise<Downloader> {
    const downloader = new Downloader(uiUpdateCallback);
    await downloader.loadDependencies();
    return downloader;
  }

  private async DownloadTrack(trackId: string, accessToken: string, downloadFormat: AudioFormat): Promise<TrackData> {

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

    const fileToDownload = file.find(x => x.format === downloadFormat);

    if (!fileToDownload)
      throw new Error(`No files to download in format ${downloadFormat}`);

    const streamUrl = await SpotifyAPI.getStreamUrl(fileToDownload.file_id, accessToken);
    const coverUrl = await SpotifyAPI.getCoverUrl(metadata, Metadata.ImageSize.DEFAULT);

    const downloadTrackTask = Helpers.fetchUrlAsFileDataProgress(streamUrl, trackId, this.trackDownloadManager.trackDownloadProgressCallback);
    let downloadCoverTask: Promise<FileDownloadData<Buffer>> | undefined = undefined;

    if (coverUrl) {
      downloadCoverTask = Helpers.fetchUrlAsFileData(coverUrl);
    }

    let key: string | undefined;

    if (AudioFormatUtil.isAAC(downloadFormat)) {
      const pssh_b64 = await SpotifyAPI.getPsshB64(fileToDownload.file_id, accessToken);

      const pssh_buffer = Buffer.from(pssh_b64, 'base64');;

      const parsedPssh = Pssh.parse(pssh_buffer);

      const cdm = new Cdm();

      const bytesArray = cdm.getLicenseChallenge(this.device, parsedPssh, LicenseProtocol.LicenseType.STREAMING);

      const widevineLicense = await SpotifyAPI.getWidevineLicense(bytesArray, accessToken);

      const parsedKeys = await cdm.parseLicenseAndGetKeys(widevineLicense, this.device);

      if (parsedKeys.length == 0)
        throw new Error(`No keys found by the content decryption module`);

      key = Helpers.toHexString(parsedKeys[0].keyValue);
    }
    /*else if (AudioFormatUtil.isVorbis(downloadFormat)) {
      let writer: Writer | undefined;

      const playplay_license_request: PlayPlayLicenseRequest = PlayPlayLicenseRequest.create({
        version: 2,
        token: Buffer.from("01e132cae527bd21620e822f58514932", 'hex'),
        contentType: ContentType.AUDIO_TRACK,
        interactivity: Interactivity.INTERACTIVE,
      });
      writer = Writer.create();
      PlayPlayLicenseRequest.encode(playplay_license_request, writer);
      const playplay_license_request_bytes = Buffer.from(writer.finish());
      const url = `https://gew4-spclient.spotify.com/playplay/v1/key/${fileToDownload.file_id}`;

      const headers = new Headers({
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream' // Ajustez si nécessaire
      });

      const requestOptions: RequestInit = {
        method: 'POST',
        headers: headers,
        body: playplay_license_request_bytes
      };

      const response = await fetch(url, requestOptions);

      const playplay_license_response = PlayPlayLicenseResponse.decode(new Uint8Array(await response.arrayBuffer()));
      console.log(playplay_license_response);
      debugger;
    }*/
    else
      throw new Error(`Unsupported audio format ${downloadFormat}`);


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
      audioFormat: downloadFormat
    };
    return obj;
  }

  async DownloadTrackAndDecrypt(trackIds: Set<string>, accessToken: string, downloadFormat: AudioFormat, saveCallback: (result: DownloadResult) => void): Promise<void> {

    trackIds.forEach(id => {
      this.trackDownloadManager.initializeFile(id);
    });

    const downloadPromises: Promise<TrackData>[] = [];

    trackIds.forEach(id => {
      const downloadPromise = this.DownloadTrack(id, accessToken, downloadFormat);
      downloadPromises.push(downloadPromise);
    });

    const downloadedTracks = await Promise.all(downloadPromises);



    for (const element of downloadedTracks) {
      if (!this.mp4Tool)
        throw new Error(`ffmpeg not initialized`);
      const buffer = await this.mp4Tool.ProcessFiles(element);

      const fileDataBuffer: FileDownloadData<Uint8Array> = {
        arrayBuffer: buffer,
        mimetype: element.trackFiledata.mimetype,
        extension: element.trackFiledata.extension
      };

      const elt: DownloadResult = {
        metadata: element.metadata,
        data: fileDataBuffer
      }

      this.trackDownloadManager.decryptionProgressCallback(element.spotifyId);

      saveCallback(elt);

      this.trackDownloadManager.saveProgressCallback(element.spotifyId);
    }


  }
}
export default Downloader;