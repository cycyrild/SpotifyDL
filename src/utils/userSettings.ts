import { AudioFormat } from "../audioformats";
import { mapToMatroskaContainer, OutputSettings } from "./audioOutput";

const USER_SETTINGS_KEY = 'settings';

export interface Settings {
    format: AudioFormat;
    maxDownloadConcurrency: number;
    retryOptions: RetryOptions;
    getOutputSettings(format: AudioFormat): OutputSettings;
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
        typeof settings.maxDownloadConcurrency === 'number' &&
        settings.maxDownloadConcurrency > 0 &&
        settings.retryOptions &&
        typeof settings.retryOptions === 'object' &&
        typeof settings.retryOptions.retries === 'number' &&
        settings.retryOptions.retries >= 0 &&
        typeof settings.retryOptions.delay === 'number' &&
        settings.retryOptions.delay >= 0 &&
        typeof settings.getOutputSettings === 'function'
    );
}

export const defaultSettings: Settings = {
    format: AudioFormat.OGG_VORBIS_160,
    maxDownloadConcurrency: 5,
    retryOptions: {
        retries: 5,
        delay: 2500
    },
    getOutputSettings: mapToMatroskaContainer
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