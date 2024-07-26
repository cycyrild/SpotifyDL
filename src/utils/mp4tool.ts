import { FFmpeg } from '@ffmpeg/ffmpeg';
import { TrackMetadata } from '../spotify-api/metadata';
import { TrackData } from "../trackdata"


const FFMPEG_CORE = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.js');
const FFMPEG_CORE_WASM = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.wasm');
const FFMPEG_WORKER = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.worker.js');

class MP4Tool {

    private ffmpeg: FFmpeg;

    private constructor(ffmpeg: FFmpeg) {
        this.ffmpeg = ffmpeg;
    }

    static async create(): Promise<MP4Tool> {
        const ffmpeg = new FFmpeg();
        await ffmpeg.load({
            coreURL: FFMPEG_CORE,
            wasmURL: FFMPEG_CORE_WASM,
            workerURL: FFMPEG_WORKER
        });
        return new MP4Tool(ffmpeg);
    }

    private async ffmpegExecute(inputFilename: string, outputFilename: string, coverFilename: string | undefined, metadata: TrackMetadata, decryptionKey: string) {

        function convertToISO8601(date) {
            const year = date.year;
            const month = date.month ? String(date.month).padStart(2, '0') : '01';
            const day = date.day ? String(date.day).padStart(2, '0') : '01';
            return `${year}-${month}-${day}`;
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

        const composer = metadata.artist_with_role.find(x => x.role === "ARTIST_ROLE_COMPOSER");

        const metadataArgs = [
            { key: 'title', value: metadata.original_title },
            { key: 'album', value: metadata.album.name },
            { key: 'date', value: convertToISO8601(metadata.album.date) },
            { key: 'artist', value: metadata.artist.map(x => x.name).join('; ') },
            { key: 'album_artist', value: metadata.album.artist.map(x => x.name).join('; ') },
            { key: 'comment', value: metadata.external_id ? metadata.external_id.map(x => `${x.type.toUpperCase()}: ${x.id}`).join(';') : '' },
            { key: 'disc', value: metadata.disc_number },
            { key: 'track', value: metadata.number },
            { key: 'composer', value: composer ? composer.artist_name : '' },
        ];

        metadataArgs.forEach(arg => {
            ffmpegArgs.push('-metadata', `${arg.key}=${arg.value}`);
        });

        ffmpegArgs.push('-c:a', 'copy', outputFilename);

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

        await this.ffmpeg.writeFile(audioInputFilename, track.trackFiledata.arrayBuffer);

        if (track.coverFileData) {
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
