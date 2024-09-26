import { Writer } from "protobufjs";
import { Interactivity, PlayPlayLicenseRequest, ContentType, PlayPlayLicenseResponse } from "./playplay/playplay";
import { SpotifyAPI } from "./spotify-api/spotify-api";
import { RetryOptions } from "./utils/userSettings";
import { Buffer } from "buffer";
import { PlayPlayDecrypt } from "./playplay/playplayDecrypt";
//import forge from 'node-forge';

const REQUEST_TOKEN = Buffer.from("01e132cae527bd21620e822f58514932", "hex");
const NONCE = '72e067fbddcbcf77';
const INITIAL_VALUE = 'ebe8bc643f630d93';

export async function getKey(fileId: string, accessToken: string, playPlayDecrypt: PlayPlayDecrypt, retryOptions: RetryOptions): Promise<string> {
  const playplayLicenseRequest = PlayPlayLicenseRequest.create({
    version: 2,
    token: REQUEST_TOKEN,
    interactivity: Interactivity.INTERACTIVE,
    contentType: ContentType.AUDIO_TRACK
  });

  const writer = Writer.create();
  PlayPlayLicenseRequest.encode(playplayLicenseRequest, writer);
  const playplayLicenseRequestBuffer = writer.finish();

  const playplayResponseBytes = await SpotifyAPI.getPlayPlayLicense(playplayLicenseRequestBuffer, fileId, accessToken, retryOptions);

  const response = PlayPlayLicenseResponse.decode(playplayResponseBytes);
  if (!response.obfuscatedKey)
    throw new Error("No obfuscated key in PlayPlay license response");

  const obfuscatedKey = response.obfuscatedKey;
  const key = await playPlayDecrypt.processKeys(Buffer.from(fileId, "hex"), obfuscatedKey);
  const keyStrg = Buffer.from(key).toString('hex');

  return keyStrg;
}


export async function decipherData(encryptedData: Buffer, keyStrg: string): Promise<Buffer> {
  const keyBytes = Buffer.from(keyStrg, 'hex');
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-CTR' },
    false,
    ['decrypt']
  );

  const counter = Buffer.from(NONCE + INITIAL_VALUE, 'hex');

  const decryptedArrayBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-CTR',
      counter: counter,
      length: 64
    },
    key,
    encryptedData
  );

  return Buffer.from(decryptedArrayBuffer);
}