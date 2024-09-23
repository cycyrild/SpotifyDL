import { Writer } from "protobufjs";
import { Interactivity, PlayPlayLicenseRequest, ContentType, PlayPlayLicenseResponse } from "./playplay/playplay.ts";
import {SpotifyAPI} from "./spotify-api/spotify-api.ts";
import { RetryOptions } from "./utils/userSettings";
import { Buffer } from "buffer";
import { PlayPlayDecrypt } from "./playplay/playplayDecrypt.ts";
import forge from 'node-forge';
import * as Helpers from "./utils/helpers"

export async function getKey(fileId: string, accessToken: string, playPlayDecrypt: PlayPlayDecrypt, retryOptions: RetryOptions) : Promise<string> {
    const playplayLicenseRequest = PlayPlayLicenseRequest.create({
        version: 2,
        token: Buffer.from("01e132cae527bd21620e822f58514932", "hex"),
        interactivity: Interactivity.INTERACTIVE,
        contentType: ContentType.AUDIO_TRACK
    });
    
    const writer = Writer.create();
    PlayPlayLicenseRequest.encode(playplayLicenseRequest, writer);
    const playplayLicenseRequestBuffer = writer.finish();
    
    const playplayResponseBytes = await SpotifyAPI.getPlayPlayLicense(playplayLicenseRequestBuffer, fileId, accessToken, retryOptions);

    const response = PlayPlayLicenseResponse.decode(playplayResponseBytes);
    if(!response.obfuscatedKey)
        throw new Error("No obfuscated key in PlayPlay license response");

    const obfuscatedKey = response.obfuscatedKey;
    const key = await playPlayDecrypt.processKeys(Buffer.from(fileId, "hex"), obfuscatedKey);
    const keyStrg = Buffer.from(key).toString('hex');

    return keyStrg;
} 


export async function decipherData(encryptedData: Buffer, keyStrg: string)
{
    const nonce = '72e067fbddcbcf77';
    const initialValue = 'ebe8bc643f630d93';

    const cipher = forge.cipher.createDecipher('AES-CTR', forge.util.hexToBytes(keyStrg));
    
    const fullCounter = forge.util.createBuffer(forge.util.hexToBytes(nonce + initialValue));

    cipher.start({
      iv: fullCounter.getBytes()
    });

    cipher.update(forge.util.createBuffer(encryptedData.toString('binary')));

    if (!cipher.finish()) {
      throw new Error('Decryption failed.');
    }

    const decryptedData = Buffer.from(cipher.output.getBytes(), 'binary');

    return decryptedData;
}