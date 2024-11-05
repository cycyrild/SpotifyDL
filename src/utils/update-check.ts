const repo = 'cycyrild/SpotifyDL';

interface VersionCache {
    latestVersion: string;
    timestamp: number;
}

const VERSION_CACHE_KEY = 'versionCache';

async function getLatestVersion(repo: string): Promise<string> {
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
        if (!response.ok) {
            throw new Error(`Error retrieving latest version for ${repo}: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const latestVersion = data.tag_name;
        return latestVersion;
    } catch (error) {
        console.error(`Error retrieving latest version for ${repo}: ${error}`, error);
        throw error;
    }
}

export async function isUpdated(): Promise<boolean> {
    const currentVersion = chrome.runtime.getManifest().version;
    const cache = await getCache();

    if (cache && cache.timestamp > Date.now() - 12 * 60 * 60 * 1000) {
        console.log('Using cached version:', cache.latestVersion);
        return checkVersion(currentVersion, cache.latestVersion);
    } else {
        const latestVersion = await getLatestVersion(repo);
        await setCache(latestVersion);
        return checkVersion(currentVersion, latestVersion);
    }
}

function checkVersion(currentVersion: string, latestVersion: string): boolean {
    const extractedVersion = extractNumbersAfterLetters(latestVersion);
    if (!extractedVersion) {
        throw new Error(`Unable to extract version number from ${latestVersion}`);
    }
    if (currentVersion < extractedVersion) {
        console.log(`A new version of ${repo} is available!`);
        return false;
    } else {
        console.log(`You are using the latest version of ${repo}`);
        return true;
    }
}

function extractNumbersAfterLetters(input: string): string | undefined {
    const regex = /[a-zA-Z]+([\d.]+)/;
    const match = input.match(regex);
    if (match) {
        return match[1];
    }
    return undefined;
}

async function getCache(): Promise<VersionCache | null> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([VERSION_CACHE_KEY], (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            const cache = result[VERSION_CACHE_KEY];
            if (cache && cache.latestVersion && cache.timestamp) {
                resolve(cache as VersionCache);
            } else {
                resolve(null);
            }
        });
    });
}

async function setCache(version: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        const versionCache: VersionCache = { latestVersion: version, timestamp: timestamp };
        chrome.storage.local.set({ [VERSION_CACHE_KEY]: versionCache }, () => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve();
        });
    });
}
