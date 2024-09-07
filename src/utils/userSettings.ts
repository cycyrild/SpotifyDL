import { AudioFormat } from "../audioformats";


export interface Settings {
    format: AudioFormat;
    maxDownloadConcurency: number;
}

export const defaultSettings: Settings = {
    format: AudioFormat.MP4_128,
    maxDownloadConcurency: 5
};


export async function saveSettings(settings: Settings): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ settings }, () => {
            console.log('Settings saved');
            resolve();
        });
    });
}
export function loadSettings(): Promise<Settings> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['settings'], (result) => {
            if (result.settings) {
                resolve(result.settings);
            } else {
                resolve(defaultSettings);
            }
        });
    });
}