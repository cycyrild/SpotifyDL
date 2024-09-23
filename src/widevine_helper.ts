import { SpotifyAPI } from "./spotify-api/spotify-api";
import { RetryOptions } from "./utils/userSettings";
import { Pssh } from './widevine/pssh'
import { Cdm } from './widevine/cdm'
import * as LicenseProtocol from './widevine/license_protocol';
import { DeviceV2 } from "./widevine/device";


export async function getKey(fileId: string, accessToken: string, device: DeviceV2, retryOptions: RetryOptions) : Promise<string> {
    const pssh_b64 = await SpotifyAPI.getPsshB64(fileId, accessToken);

    const pssh_buffer = Buffer.from(pssh_b64, 'base64');;

    const parsedPssh = Pssh.parse(pssh_buffer);

    const cdm = new Cdm();

    const bytesArray = cdm.getLicenseChallenge(device, parsedPssh, LicenseProtocol.LicenseType.STREAMING);

    const widevineLicense = await SpotifyAPI.getWidevineLicense(bytesArray, accessToken, retryOptions);

    const parsedKeys = await cdm.parseLicenseAndGetKeys(widevineLicense, device);

    if (parsedKeys.length == 0)
      throw new Error(`No keys found by the content decryption module`);

    return Buffer.from(parsedKeys[0].keyValue).toString('hex');
}