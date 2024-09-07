export enum AudioFormat {
    // Group AAC formats
    MP4_128 = 'MP4_128',
    MP4_256 = 'MP4_256',

    // Group VORBIS formats
    OGG_VORBIS_320 = 'OGG_VORBIS_320',
    OGG_VORBIS_160 = 'OGG_VORBIS_160',
    OGG_VORBIS_96 = 'OGG_VORBIS_96',
}

export class AudioFormatUtil {
    static isAAC(format: AudioFormat): boolean {
        return [
            AudioFormat.MP4_128,
            AudioFormat.MP4_256,
        ].includes(format);
    }

    static isVorbis(format: AudioFormat): boolean {
        return [
            AudioFormat.OGG_VORBIS_320,
            AudioFormat.OGG_VORBIS_160,
            AudioFormat.OGG_VORBIS_96,
        ].includes(format);
    }
}