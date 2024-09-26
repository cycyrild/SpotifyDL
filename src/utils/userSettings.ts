import { AudioFormat } from "../audioformats";

const USER_SETTINGS_KEY = 'settings';


export interface Settings {
    format: AudioFormat;
    maxDownloadConcurency: number;
    retryOptions: RetryOptions;
    outputAudioContainer: string;
}

export interface RetryOptions {
    retries: number;
    delay: number;
}

export function isValidSettings(settings: any): settings is Settings {
    return (
        settings &&
        typeof settings === 'object' &&
        Object.values(AudioFormat).includes(settings.format) &&
        typeof settings.maxDownloadConcurency === 'number' &&
        settings.maxDownloadConcurency > 0 &&
        settings.retryOptions &&
        typeof settings.retryOptions === 'object' &&
        typeof settings.retryOptions.retries === 'number' &&
        settings.retryOptions.retries >= 0 &&
        typeof settings.retryOptions.delay === 'number' &&
        settings.retryOptions.delay >= 0 &&
        typeof settings.outputAudioContainer === 'string'
    );
}

export const defaultSettings: Settings = {
    format: AudioFormat.OGG_VORBIS_160,
    maxDownloadConcurency: 5,
    retryOptions: {
        retries: 5,
        delay: 2500
    },
    outputAudioContainer: 'mka'
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
                saveSettings(defaultSettings);
                resolve(defaultSettings);
            }
        });
    });
}