import * as licenseProtocol from './widevine';
import { Buffer } from 'buffer';
import forge from 'node-forge';

const Magic: string = "WVD";

export enum DeviceTypes {
	CHROME = 1,
	ANDROID = 2
}

export class DeviceV2 {

	public Version: number;
	public Type: DeviceTypes;
	public SecurityLevel: number;
	public Flags: number;
	public PrivateKey: Buffer;
	public ClientId: licenseProtocol.ClientIdentification;
	public RsaPrivateCrt: forge.pki.rsa.PrivateKey;

	private constructor(
		Version: number,
		Type: DeviceTypes,
		SecurityLevel: number,
		Flags: number,
		PrivateKey: Buffer,
		ClientId: licenseProtocol.ClientIdentification,
		RsaPrivateCrt: forge.pki.rsa.PrivateKey
	) {
		this.Version = Version;
		this.Type = Type;
		this.SecurityLevel = SecurityLevel;
		this.Flags = Flags;
		this.PrivateKey = PrivateKey;
		this.ClientId = ClientId;
		this.RsaPrivateCrt = RsaPrivateCrt;
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

		const type = reader.getUint8(offset++) as DeviceTypes;
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
		const rsaPrivateCrt = DeviceV2.readRsaPrivateCrt(privateKey);

		return new DeviceV2(
			version,
			type,
			securityLevel,
			flags,
			privateKey,
			clientIdDecoded,
			rsaPrivateCrt
		);
	}

	private static readRsaPrivateCrt(privateKey: ArrayBuffer): forge.pki.rsa.PrivateKey {
		const asn1 = forge.asn1.fromDer(forge.util.createBuffer(new Uint8Array(privateKey)));
		const privateKeyInfo = forge.pki.privateKeyFromAsn1(asn1);

		return privateKeyInfo;
	}
}
