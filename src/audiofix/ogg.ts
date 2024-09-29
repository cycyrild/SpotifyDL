import { Buffer } from "buffer";

const OggS = Buffer.from("OggS", "utf-8");
const OggStart = Buffer.from([0x00, 0x02]);
const Zeroes = Buffer.alloc(10, 0x00);

export function rebuildOgg(buffer: Buffer) {

  OggS.copy(buffer, 0, 0, OggS.length);

  OggStart.copy(buffer, 4, 0, OggStart.length);

  Zeroes.copy(buffer, 6, 0, Zeroes.length);
}