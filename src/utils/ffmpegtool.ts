import { FFmpeg } from '@ffmpeg/ffmpeg';
import { TrackMetadata } from '../spotify-api/metadata';
import { TrackData } from "../trackdata"
import { Mutex } from 'async-mutex';


const FFMPEG_CORE = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.js');
const FFMPEG_CORE_WASM = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.wasm');
const FFMPEG_WORKER = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.worker.js');

class FFMPEGTool {

    private ffmpeg: FFmpeg;
    private mutex: Mutex;

    private constructor(ffmpeg: FFmpeg) {
        this.ffmpeg = ffmpeg;
        this.mutex = new Mutex();
    }

    public static async create(): Promise<FFMPEGTool> {
        const ffmpeg = new FFmpeg();
        const isFirst = await ffmpeg.load({
            coreURL: FFMPEG_CORE,
            wasmURL: FFMPEG_CORE_WASM,
            workerURL: FFMPEG_WORKER
        });

        /*ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });*/

        if (!isFirst)
            throw new Error("An instance of ffmpeg has already been initialized");
        else
            return new FFMPEGTool(ffmpeg);
    }

    private async ffmpegExecute(inputFilename: string, outputFilename: string, coverFilename: string | undefined, metadata: TrackMetadata, decryptionKey: string | undefined) {

        function convertToISO8601(date: any ) {
            const year = date.year;
            const month = date.month ? String(date.month).padStart(2, '0') : '01';
            const day = date.day ? String(date.day).padStart(2, '0') : '01';
            return `${year}-${month}-${day}`;
        }

        const ffmpegArgs: string[] = [];

        if (decryptionKey)
            ffmpegArgs.push('-decryption_key', decryptionKey);

        ffmpegArgs.push('-i', inputFilename);

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

        try {
            const error = await this.ffmpeg.exec(ffmpegArgs);

            if (error != 0) {
                throw new Error(`FFmpeg execution failed with code: ${error}`);
            }
        } catch (e:any) {
            console.error("FFmpeg execution encountered an error:", e);
            throw new Error(`FFmpeg runtime error: ${e.messag}`);
        }
    }

    public async ProcessFiles(track: TrackData, audioContainer: string) {
        let coverFilename: string | undefined;
        const audioOutputFilename = `A${track.spotifyId}.${audioContainer}`;
        const audioInputFilename = `B${track.spotifyId}`;


        return await this.mutex.runExclusive(async () => {
            await this.ffmpeg.writeFile(audioInputFilename, track.trackFiledata);

            if (track.coverFileData) {
                coverFilename = `C${track.spotifyId}`;
                await this.ffmpeg.writeFile(coverFilename, track.coverFileData);
            }

            await this.ffmpegExecute(audioInputFilename, audioOutputFilename, coverFilename, track.metadata, track.ffmpegDecryptionKey);

            const decryptedFile = await this.ffmpeg.readFile(audioOutputFilename);

            if (!(decryptedFile instanceof Uint8Array)) {
                throw new Error("Inconsistent ffmpeg return type");
            }

            await this.ffmpeg.deleteFile(audioOutputFilename);
            await this.ffmpeg.deleteFile(audioInputFilename);

            if (coverFilename) {
                await this.ffmpeg.deleteFile(coverFilename);
            }

            return decryptedFile;
        });



    }

}

export default FFMPEGTool;
