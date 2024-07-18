import { FFmpeg } from '@ffmpeg/ffmpeg';

import { TrackMetadata, DateMetadata } from '../spotify-api/metadata';
import { FileDownloadData } from "./helpers"
import { Buffer } from 'buffer';
import { TrackData } from "../trackdata"


const FFMPEG_CORE = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.js');
const FFMPEG_CORE_WASM = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.wasm');
const FFMPEG_WORKER = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.worker.js');

class MP4Tool {

    private ffmpeg: FFmpeg;

    constructor() {
        this.ffmpeg = new FFmpeg();
    }

    async LoadFFmpeg() {

        await this.ffmpeg.load({
            coreURL: FFMPEG_CORE,
            wasmURL: FFMPEG_CORE_WASM,
            workerURL: FFMPEG_WORKER
        });
    }

    private async ffmpegExecute(inputFilename: string, outputFilename: string, coverFilename: string | undefined, metadata: TrackMetadata, decryptionKey: string) {

        function convertToLongDateUS(date) {
            const year = date.year;
            const month = date.month ? date.month - 1 : 0;
            const day = date.day ? date.day : 1;
            const jsDate = new Date(year, month, day);
            return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(jsDate);
        }

        let ffmpegArgs = [
            '-decryption_key', decryptionKey,
            '-i', inputFilename
        ];

        if (coverFilename) {
            ffmpegArgs.push(
                "-i", coverFilename,
                "-map", "0", "-map", "1",
                "-disposition:v", "attached_pic",
                "-c:v", "copy"
            );
        } else {
            ffmpegArgs.push("-map", "0");
        }

        ffmpegArgs.push(
            '-metadata', `title=${metadata.original_title}`,
            '-metadata', `album=${metadata.album.name}`,
            '-metadata', `date=${convertToLongDateUS(metadata.album.date)}`,
            '-metadata', `artist=${metadata.artist.map(x => x.name).join('; ')}`,
            '-metadata', `album_artist=${metadata.album.artist.map(x => x.name).join(', ')}`,
            '-metadata', `comment=${metadata.external_id.map(x => `${x.type.toUpperCase()}: ${x.id}`).join('\n')}`,
            '-metadata', `disc=${metadata.disc_number}`,
            '-c:a', 'copy',
            outputFilename
        );

        let error = await this.ffmpeg.exec(ffmpegArgs);

        if (error != 0) {
            throw new Error("ffmpeg runtime error");
        }
    }



    public async ProcessFiles(track: TrackData) {
        let coverFilename: string | undefined;
        let audioInputFilename: string;
        let audioOutputFilename: string;

        audioOutputFilename = `A${track.metadata.gid}.${track.trackFiledata.extension}`;
        audioInputFilename = `B${track.metadata.gid}.${track.trackFiledata.extension}`;

        if (!(track.trackFiledata?.arrayBuffer instanceof Buffer)) {
            throw new Error("Inconsistent audioFile type");
        }

        await this.ffmpeg.writeFile(audioInputFilename, track.trackFiledata.arrayBuffer);

        if (track.coverFileData) {
            if (!(track.coverFileData.arrayBuffer instanceof Buffer)) {
                throw new Error("Inconsistent coverFile type");
            }
            coverFilename = `${track.metadata.gid}.${track.coverFileData.extension}`;
            await this.ffmpeg.writeFile(coverFilename, track.coverFileData.arrayBuffer);
        }

        await this.ffmpegExecute(audioInputFilename, audioOutputFilename, coverFilename, track.metadata, track.key);


        const decryptedFile = await this.ffmpeg.readFile(audioOutputFilename);

        if (!(decryptedFile instanceof Uint8Array)) {
            throw new Error("Inconsistent ffmpeg return type");
        }

        this.ffmpeg.deleteFile(audioOutputFilename);
        this.ffmpeg.deleteFile(audioInputFilename);

        return decryptedFile;

    }
}

export default MP4Tool;
