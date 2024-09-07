export interface AccessToken {
    clientId: string;
    accessToken: string;
    accessTokenExpirationTimestampMs: number;
    isAnonymous: boolean;
}

const SPOTIFY_ACCESS_TOKEN_KEY = 'spotifyAccessToken';

async function fetchAccessToken(): Promise<AccessToken> {
    const URL = "https://open.spotify.com/get_access_token";
    const response = await fetch(URL, {
        credentials: "same-origin",
    });
    return response.json();
}

function getAccessTokenFromCache(): Promise<AccessToken | null> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([SPOTIFY_ACCESS_TOKEN_KEY], (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }

            const token: AccessToken = result[SPOTIFY_ACCESS_TOKEN_KEY];
            if (token && token.accessTokenExpirationTimestampMs > Date.now()) {
                resolve(token);
            } else {
                resolve(null);
            }
        });
    });
}

function setAccessTokenInCache(token: AccessToken): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [SPOTIFY_ACCESS_TOKEN_KEY]: token }, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }
            resolve();
        });
    });
}

export async function getAccessToken(): Promise<AccessToken | null> {
    let token = await getAccessTokenFromCache();
    if (!token) {
        token = await fetchAccessToken();
        if (token.isAnonymous) {
            return null;
        }
        await setAccessTokenInCache(token);
    }
    return token;
}

export function removeAccessTokenFromCache(): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove(SPOTIFY_ACCESS_TOKEN_KEY, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }
            resolve();
        });
    });
}
