import { AudioFormat } from "../audioformats";

const USER_SETTINGS_KEY = 'settings';


export interface Settings {
    format: AudioFormat;
    maxDownloadConcurency: number;
    retryOptions: RetryOptions;
}

export interface RetryOptions {
    retries: number;
    delay: number;
}

function isValidSettings(settings: any): settings is Settings {
    return (
        settings &&
        Object.values(AudioFormat).includes(settings.format) &&
        typeof settings.maxDownloadConcurency === 'number' &&
        settings.retryOptions &&
        typeof settings.retryOptions === 'object' &&
        typeof settings.retryOptions.retries === 'number' &&
        typeof settings.retryOptions.delay === 'number'
    );
}

export const defaultSettings: Settings = {
    format: AudioFormat.MP4_128,
    maxDownloadConcurency: 1,
    retryOptions: {
        retries: 5,
        delay: 2500
    }
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