import { AesCmac } from "aes-cmac";
import forge from 'node-forge';
import * as licenseProtocol from './license_protocol';
import { Key } from './key'
import { DeviceV2 } from './device'
import { PsshInterface } from './pssh'
import Long from 'long';
import { Writer } from 'protobufjs/minimal';
import { Buffer } from 'buffer';

const maxUint32 = 0xFFFFFFFF;

export class Cdm {

    private context: [Buffer, Buffer] | undefined;

    sign(licenseRequest: Buffer, privateKey: forge.pki.rsa.PrivateKey): Buffer {
        const md = forge.md.sha1.create();
        md.update(licenseRequest.toString('binary'));

        const pss: forge.pki.rsa.SignatureScheme = forge.pss.create({
            md: forge.md.sha1.create(),
            mgf: forge.mgf.mgf1.create(forge.md.sha1.create()),
            saltLength: 20
        });

        const signature: forge.Bytes = privateKey.sign(md, pss);

        return Buffer.from(signature, 'binary');
    }

    async deriveKey(key: Buffer, context: Buffer, counter: number): Promise<Buffer> {
        const data = Buffer.concat([Buffer.from([counter]), context]);
        const aesCmac = new AesCmac(key);
        return Buffer.from(await aesCmac.calculate(data));
    }

    async deriveKeys(encContext: Buffer, macContext: Buffer, key: Buffer): Promise<Buffer[]> {
        const encKey = await this.deriveKey(key, encContext, 1);
        const macKeyServerPart1 = await this.deriveKey(key, macContext, 1);
        const macKeyServerPart2 = await this.deriveKey(key, macContext, 2);
        const macKeyClientPart1 = await this.deriveKey(key, macContext, 3);
        const macKeyClientPart2 = await this.deriveKey(key, macContext, 4);

        const macKeyServer = Buffer.concat([macKeyServerPart1, macKeyServerPart2]);
        const macKeyClient = Buffer.concat([macKeyClientPart1, macKeyClientPart2]);

        return [encKey, macKeyServer, macKeyClient];
    }

    deriveContext(message: Buffer): [Buffer, Buffer] {
        function buildThing(label: string, keySize: Buffer): Buffer {
            const labelBuffer = Buffer.from(label + '\0', 'ascii');
            const ms = Buffer.concat([labelBuffer, message, keySize]);
            return ms;
        }

        const encryptionKeySize = Buffer.from([0, 0, 0, 0x80]); // 128-bit
        const authenticationKeySize = Buffer.from([0, 0, 2, 0]); // 512-bit

        return [
            buildThing('ENCRYPTION', encryptionKeySize),
            buildThing('AUTHENTICATION', authenticationKeySize)
        ];
    }

    public async parseLicenseAndGetKeys(signedMessageData: Uint8Array, device: DeviceV2): Promise<Key[]> {

        function decrypt(inputData: Uint8Array, privateKey: forge.pki.rsa.PrivateKey): Buffer {
            const encryptedData: forge.Bytes = forge.util.binary.raw.encode(inputData);

            const decryptedData = privateKey.decrypt(encryptedData, 'RSA-OAEP', {
                md: forge.md.sha1.create()
            });

            return Buffer.from(forge.util.binary.raw.decode(decryptedData));
        }

        const signedMessage = licenseProtocol.SignedMessage.decode(signedMessageData);

        if (!signedMessage.msg || !signedMessage.sessionKey) {
            throw new Error('Invalid signed message or session key');
        }

        const license = licenseProtocol.License.decode(signedMessage.msg);

        const decryptedKey = decrypt(signedMessage.sessionKey, device.RsaPrivateCrt);

        if (!this.context?.[0] || !this.context[1])
            throw new Error('Invalid context');

        const keys = await this.deriveKeys(this.context?.[0], this.context[1], decryptedKey);


        return license.key.map((k: licenseProtocol.License_KeyContainer) => Key.fromKeyContainer(k, keys[0]));
    }

    public getLicenseChallenge(device: DeviceV2, pssh: PsshInterface, licenseType: licenseProtocol.LicenseType = licenseProtocol.LicenseType.STREAMING): Uint8Array {
        function generateRandomBytes(size: number): Buffer {
            const bytes = forge.random.getBytesSync(size);
            return Buffer.from(bytes, 'binary');
        }
        function getCurrentTimestampInSeconds(): Long {
            const now = new Date();
            const timestampInSeconds = Math.floor(now.getTime() / 1000);
            return Long.fromNumber(timestampInSeconds);
        }

        const randomBytes = generateRandomBytes(16);
        let writer: Writer | undefined;


        const lr: licenseProtocol.LicenseRequest = {
            clientId: device.ClientId,
            contentId: {
                widevinePsshData: {
                    licenseType: licenseType,
                    psshData: [pssh.InitData],
                    requestId: randomBytes
                }
            },
            type: licenseProtocol.LicenseRequest_RequestType.NEW,
            requestTime: getCurrentTimestampInSeconds(),
            protocolVersion: licenseProtocol.ProtocolVersion.VERSION_2_1,
            keyControlNonce: Math.floor(Math.random() * maxUint32) + 1
        };

        writer = Writer.create();
        licenseProtocol.LicenseRequest.encode(lr, writer);
        const lr_bytes = Buffer.from(writer.finish());

        const signaure = this.sign(lr_bytes, device.RsaPrivateCrt);

        const signedMsg: licenseProtocol.SignedMessage = {
            type: licenseProtocol.SignedMessage_MessageType.LICENSE_REQUEST,
            msg: lr_bytes,
            signature: signaure,
            metricData: []
        };

        this.context = this.deriveContext(lr_bytes);

        writer = Writer.create();
        licenseProtocol.SignedMessage.encode(signedMsg, writer);
        const signedMsg_bytes = writer.finish();

        return signedMsg_bytes;
    }

}