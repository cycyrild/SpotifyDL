import { AudioFormat } from "../audioformats";

const USER_SETTINGS_KEY = 'settings';

export interface Settings {
    format: AudioFormat;
    maxDownloadConcurrency: number;
    retryOptions: RetryOptions;
    convertToMP4AAC: boolean;
}

export interface RetryOptions {
    retries: number;
    delay: number;
}

export function isValidSettings(settings: Settings): boolean {
    function isValidAudioFormat(format: AudioFormat): boolean {
        return Object.values(AudioFormat).includes(format);
    }

    function isValidRetryOptions(retryOptions: RetryOptions): boolean {
        return (
            typeof retryOptions.retries === 'number' &&
            retryOptions.retries >= 0 &&
            typeof retryOptions.delay === 'number' &&
            retryOptions.delay >= 0
        );
    }

    return (
        isValidAudioFormat(settings.format) &&
        typeof settings.maxDownloadConcurrency === 'number' &&
        settings.maxDownloadConcurrency > 0 &&
        isValidRetryOptions(settings.retryOptions) &&
        typeof settings.convertToMP4AAC === 'boolean'
    );
}


export const defaultSettings: Settings = {
    format: AudioFormat.OGG_VORBIS_160,
    maxDownloadConcurrency: 5,
    retryOptions: {
        retries: 5,
        delay: 2500
    },
    convertToMP4AAC: false
};


export async function saveSettings(settings: Settings): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [USER_SETTINGS_KEY]: settings }, () => {
            resolve();
        });
    });
}

export function loadSettings(): Promise<Settings> {
    return new Promise((resolve) => {
        chrome.storage.local.get([USER_SETTINGS_KEY], (result) => {
            const settings = result[USER_SETTINGS_KEY];
            if (settings && isValidSettings(settings)) {
                resolve(settings);
            } else {
                console.error('Invalid settings, using default settings', settings);
                saveSettings(defaultSettings);
                resolve(defaultSettings);
            }
        });
    });
}