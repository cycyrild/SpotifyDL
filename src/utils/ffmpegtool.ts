import { FFmpeg } from '@ffmpeg/ffmpeg';
import { TrackMetadata } from '../spotify-api/metadata';
import { TrackData } from "../trackdata"
import { Mutex } from 'async-mutex';
import { OutputSettings } from './audio-output';
import { ProgressEventCallback } from '@ffmpeg/ffmpeg/dist/esm/types';


const FFMPEG_CORE = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.js');
const FFMPEG_CORE_WASM = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.wasm');
const FFMPEG_WORKER = chrome.runtime.getURL('/ffmpeg/ffmpeg-core.worker.js');

export class FFMPEGTool {

    private ffmpeg: FFmpeg;
    private mutex: Mutex;

    private constructor(ffmpeg: FFmpeg) {
        this.ffmpeg = ffmpeg;
        this.mutex = new Mutex();
    }

    public static async Create(): Promise<FFMPEGTool> {
        const ffmpeg = new FFmpeg();
        const isFirst = await ffmpeg.load({
            coreURL: FFMPEG_CORE,
            wasmURL: FFMPEG_CORE_WASM,
            workerURL: FFMPEG_WORKER
        });

        // ffmpeg.on('log', ({ /*type, */message }) => {
        //     console.log(message);
        // });

        if (!isFirst)
            throw new Error("An instance of ffmpeg has already been initialized");
        else
            return new FFMPEGTool(ffmpeg);
    }

    private async ffmpegExecute(
        progressCallback: (progress: number) => void,
        inputFilename: string,
        outputFilename: string,
        outputSettings: OutputSettings,
        metadata: TrackMetadata,
        coverFilename?: string,
        decryptionKey?: string) {

        function convertToISO8601(date: any) {
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
                "-map", "0:a",
                "-map", "1:v",
                "-c:v", outputSettings.getEmbedCoverCodec(),
                "-disposition:v", "attached_pic",
            );
        } else {
            ffmpegArgs.push("-map", "0");
        }

        const ffmpegAudioSettings = outputSettings.generateFFmpegString();
        ffmpegArgs.push(...ffmpegAudioSettings.split(' '));

        const composer = metadata.artist_with_role.find(x => x.role === "ARTIST_ROLE_COMPOSER");

        ffmpegArgs.push('-map_metadata', '-1'); // Remove original metadata from input file

        const metadataArgs = [
            { key: 'title', value: metadata.original_title },
            { key: 'album', value: metadata.album.name },
            { key: 'date', value: convertToISO8601(metadata.album.date) },
            { key: 'artist', value: metadata.artist.map(x => x.name).join('; ') },
            { key: 'album_artist', value: metadata.album.artist.map(x => x.name).join('; ') },
            { key: 'disc', value: metadata.disc_number },
            { key: 'track', value: metadata.number },
            { key: 'composer', value: composer ? composer.artist_name : '' },
            { key: 'copyright', value: metadata.album.label },
            { key: 'year', value: metadata.album.date.year },

            // External IDs
            { key: 'comment', value: metadata.external_id ? metadata.external_id.map(x => `${x.type.toUpperCase()}: ${x.id}`).join(';') : '' },
        ];

        metadataArgs.forEach(arg => {
            ffmpegArgs.push('-metadata', `${arg.key}=${arg.value}`);
        });

        ffmpegArgs.push(outputFilename);

        const handleProgress: ProgressEventCallback = (event: { progress: number; time: number }) => {
            const progress = event.progress;
            if (progress < 0 || progress > 1)
                return;
            progressCallback(progress * 100);
        };

        try {
            this.ffmpeg.on("progress", handleProgress);
            const error = await this.ffmpeg.exec(ffmpegArgs);
            this.ffmpeg.off("progress", handleProgress);

            if (error != 0) {
                throw new Error(`FFmpeg execution failed with code: ${error}`);
            }
        } catch (e: any) {
            console.error("FFmpeg execution encountered an error:", e);
            throw new Error(`FFmpeg runtime error: ${e.messag}`);
        }
    }

    public async ProcessFiles(track: TrackData, outputSettings: OutputSettings, progressCallback: (progress: number) => void) {
        let coverFilename: string | undefined;
        const audioOutputFilename = `A${track.spotifyId}`;
        const audioInputFilename = `B${track.spotifyId}`;


        return await this.mutex.runExclusive(async () => {
            await this.ffmpeg.writeFile(audioInputFilename, track.trackFiledata);

            if (track.coverFileData) {
                coverFilename = `C${track.spotifyId}`;
                await this.ffmpeg.writeFile(coverFilename, track.coverFileData);
            }

            const isFFMPEGdecryptionKey = track.decryptionKey.type === "ffmpeg";

            await this.ffmpegExecute(
                progressCallback,
                audioInputFilename,
                audioOutputFilename,
                outputSettings,
                track.metadata,
                coverFilename,
                isFFMPEGdecryptionKey ? track.decryptionKey.key : undefined);

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