import { AudioFormat } from "../audioformats";

export const AudioContainer = {
    MP4_AUDIO: { format: 'mp4', extension: 'm4a' },
    MATROSKA_AUDIO: { format: 'matroska', extension: 'mka' },
} as const;

export type AudioContainer = (typeof AudioContainer)[keyof typeof AudioContainer];

export class OutputSettings {
    container: AudioContainer;
    encodingOptions?: string;
    bitrate?: number;

  
    constructor(container: AudioContainer, encodingOptions?: string, bitrate?: number) {
        this.encodingOptions = encodingOptions;
        this.container = container;
        this.bitrate = bitrate;
    }

    generateFFmpegString(): string {
        if (!this.encodingOptions) 
            return `-c:a copy -f ${this.container.format}`;

        return `-c:a ${this.encodingOptions}${this.bitrate ? ` -b:a ${this.bitrate}k`:''} -f ${this.container.format}`;
    }
}

export type audioMapper = (format: AudioFormat) => OutputSettings;

export const mapToMP4AAC: audioMapper = (format: AudioFormat) => {
    const bitrateFactor = 1.5; //ffmpeg AAC encoder sucks
    switch (format) {
        case AudioFormat.MP4_128:
            return new OutputSettings(AudioContainer.MP4_AUDIO);
        case AudioFormat.MP4_256:
            return new OutputSettings(AudioContainer.MP4_AUDIO);
        case AudioFormat.OGG_VORBIS_320:
            return new OutputSettings(AudioContainer.MP4_AUDIO, 'aac', 320 * bitrateFactor);
        case AudioFormat.OGG_VORBIS_160:
            return new OutputSettings(AudioContainer.MP4_AUDIO, 'aac', 160 * bitrateFactor);
        case AudioFormat.OGG_VORBIS_96:
            return new OutputSettings(AudioContainer.MP4_AUDIO, 'aac', 96 * bitrateFactor);
    }
}

export const mapToMatroskaContainer: audioMapper = (format: AudioFormat) => {
    switch (format) {
        case AudioFormat.MP4_128:
            return new OutputSettings(AudioContainer.MATROSKA_AUDIO);
        case AudioFormat.MP4_256:
            return new OutputSettings(AudioContainer.MATROSKA_AUDIO);
        case AudioFormat.OGG_VORBIS_320:
            return new OutputSettings(AudioContainer.MATROSKA_AUDIO);
        case AudioFormat.OGG_VORBIS_160:
            return new OutputSettings(AudioContainer.MATROSKA_AUDIO);
        case AudioFormat.OGG_VORBIS_96:
            return new OutputSettings(AudioContainer.MATROSKA_AUDIO);
    }
}


