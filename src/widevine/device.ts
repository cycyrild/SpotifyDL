import * as licenseProtocol from './license_protocol';
import { Buffer } from 'buffer';
import forge from 'node-forge';

export enum DeviceTypes {
	CHROME = 1,
	ANDROID = 2
}

export interface DeviceV2 {
	Version: number;
	Type: DeviceTypes;
	SecurityLevel: number;
	Flags: number;
	PrivateKey: Buffer;
	ClientId: licenseProtocol.ClientIdentification;
	RsaPrivateCrt: forge.pki.rsa.PrivateKey;
}

const Magic: string = "WVD";

export class DeviceV2Parser {


	private static readRsaPrivateCrt(privateKey: ArrayBuffer): forge.pki.rsa.PrivateKey {
		const asn1 = forge.asn1.fromDer(forge.util.createBuffer(new Uint8Array(privateKey)));
		const privateKeyInfo = forge.pki.privateKeyFromAsn1(asn1);

		return privateKeyInfo;
	}


	static parse(data: Buffer): DeviceV2 {
		const expectedSignature = Buffer.from(Magic, 'ascii');

		if (!data.subarray(0, 3).equals(expectedSignature)) {
			throw new Error("Incorrect CDM device signature");
		}

		const reader = new DataView(data.buffer);
		let offset = 3;

		const version = reader.getUint8(offset++);
		if (version !== 2) {
			throw new Error("CDM version not supported");
		}

		const type = reader.getUint8(offset++);
		const securityLevel = reader.getUint8(offset++);
		const flags = reader.getUint8(offset++);

		const privateKeyLength = reader.getUint16(offset, false);
		offset += 2;
		const privateKey = Buffer.from(data.buffer.slice(offset, offset + privateKeyLength));
		offset += privateKeyLength;

		const clientIdLength = reader.getUint16(offset, false);
		offset += 2;
		const clientId = Buffer.from(data.buffer.slice(offset, offset + clientIdLength));
		offset += clientIdLength;

		const clientIdDecoded = licenseProtocol.ClientIdentification.decode(clientId);
		const rsaPrivateCrt = DeviceV2Parser.readRsaPrivateCrt(privateKey);

		return {
			Version: version,
			Type: type,
			SecurityLevel: securityLevel,
			Flags: flags,
			RsaPrivateCrt: rsaPrivateCrt,
			ClientId: clientIdDecoded,
			PrivateKey: privateKey
		};
	}

}
