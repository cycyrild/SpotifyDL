export interface AccessToken {
    clientId: string;
    accessToken: string;
    accessTokenExpirationTimestampMs: number;
    isAnonymous: boolean;
}

export class SpotifyAuth {
    private static async fetchAccessToken(cookie: string): Promise<AccessToken> {
        const URL = "https://open.spotify.com/get_access_token";
        const req = await fetch(URL, {
            headers: {
                cookie: `sp_dc=${cookie}`
            }
        });
        const resp: AccessToken = await req.json();
        return resp;
    }

    private static async getAccessTokenFromCache(): Promise<AccessToken | null> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['spotifyAccessToken'], (result) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                const token: AccessToken = result.spotifyAccessToken;
                if (token && token.accessTokenExpirationTimestampMs > Date.now()) {
                    resolve(token);
                } else {
                    resolve(null);
                }
            });
        });
    }

    private static async setAccessTokenInCache(token: AccessToken): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ spotifyAccessToken: token }, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve();
            });
        });
    }

    public static async getAccessToken(): Promise<AccessToken> {
        let token = await this.getAccessTokenFromCache();
        if (!token) {
            const cookie = await this.getSpotifyCookie();
            if (!cookie) {
                throw new Error('No Spotify login cookies detected. Please log in.');
            }
            token = await this.fetchAccessToken(cookie);
            await this.setAccessTokenInCache(token);
        }
        return token;
    }

    public static async getSpotifyCookie(): Promise<string | null> {
        return new Promise((resolve) => {
            chrome.cookies.get({ url: 'https://open.spotify.com', name: 'sp_dc' }, (cookie) => {
                if (cookie) {
                    resolve(cookie.value);
                } else {
                    resolve(null);
                }
            });
        });
    }
}

