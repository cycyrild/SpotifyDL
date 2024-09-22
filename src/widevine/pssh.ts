import * as licenseProtocol from './license_protocol';

export interface PsshInterface {
  PsshSize: number;
  PsshHeader: number;
  PsshVersion: number;
  HeaderFlag: number;
  SystemId: string;
  InitData: Uint8Array;
  psshData: licenseProtocol.WidevinePsshData;
}

export class Pssh {
  static parse(data: Uint8Array): PsshInterface {
    const reader = new DataView(data.buffer);
    let offset = 0;

    const psshSize = reader.getUint32(offset, false);
    offset += 4;
    const psshHeader = reader.getUint32(offset, false);
    offset += 4;
    const psshVersion = reader.getUint16(offset, false);
    offset += 2;
    const headerFlag = reader.getUint16(offset, false);
    offset += 2;

    const systemIdBytes = new Uint8Array(reader.buffer.slice(offset, offset + 16));
    offset += 16;
    const SystemId = Array.from(systemIdBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (psshVersion === 1) {
      throw new Error("PSSH version 1 is not implemented");
    }

    const initDataLength = reader.getInt32(offset, false);
    offset += 4;
    const initData = new Uint8Array(reader.buffer.slice(offset, offset + initDataLength));

    const psshData = licenseProtocol.WidevinePsshData.decode(initData);

    return {
      PsshSize: psshSize,
      PsshHeader: psshHeader,
      PsshVersion: psshVersion,
      HeaderFlag: headerFlag,
      SystemId: SystemId,
      InitData: initData,
      psshData: psshData
    };
  }

}

