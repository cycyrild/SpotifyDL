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

    const psshSize = this.readUInt32BigEndian(reader, offset); 
    offset += 4;
    const psshHeader = this.readUInt32BigEndian(reader, offset); 
    offset += 4;
    const psshVersion = this.readUInt16BigEndian(reader, offset); 
    offset += 2;
    const headerFlag = this.readUInt16BigEndian(reader, offset); 
    offset += 2;

    const systemIdBytes = new Uint8Array(reader.buffer.slice(offset, offset + 16));
    offset += 16;
    const SystemId = Array.from(systemIdBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (psshVersion === 1) {
      throw new Error("PSSH version 1 is not implemented");
    }

    const initDataLength = this.readInt32BigEndian(reader, offset); 
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

  static readUInt32BigEndian(reader: DataView, offset: number): number {
    return (reader.getUint8(offset) << 24) |
           (reader.getUint8(offset + 1) << 16) |
           (reader.getUint8(offset + 2) << 8) |
           reader.getUint8(offset + 3);
  }

  static readUInt16BigEndian(reader: DataView, offset: number): number {
    return (reader.getUint8(offset) << 8) | reader.getUint8(offset + 1);
  }

  static readInt32BigEndian(reader: DataView, offset: number): number {
    const value = this.readUInt32BigEndian(reader, offset);
    // Check for negative numbers (sign bit)
    if (value & 0x80000000) {
      return value - 0x100000000; // Two's complement
    }
    return value;
  }
}

