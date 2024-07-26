export enum FileFormat {
    AUTO = 'auto',
    MP3 = '.mp3',
    MP4 = '.mp4'
}

export enum DownloadQuality {
    LOW = 'MP4_128_DUAL',
    DEFAULT = LOW,
}

export interface Settings {
    format: FileFormat;
    downloadQuality: DownloadQuality;
}

const defaultSettings: Settings = {
    format: FileFormat.AUTO,
    downloadQuality: DownloadQuality.DEFAULT,
};

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

function saveSettings(settings: Settings): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ settings }, () => {
            console.log('Settings saved');
            resolve();
        });
    });
}

export async function updateFormat(newFormat: FileFormat) {
    const settings = await loadSettings();
    const newSettings = { ...settings, format: newFormat };
    await saveSettings(newSettings);
}