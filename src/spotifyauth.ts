export interface AccessToken {
    clientId: string;
    accessToken: string;
    accessTokenExpirationTimestampMs: number;
    isAnonymous: boolean;
}

const SPOTIFY_ACCESS_TOKEN_KEY = 'spotifyAccessToken';

export class SpotifyAuth {
    private static async fetchAccessToken(): Promise<AccessToken> {
        const URL = "https://open.spotify.com/get_access_token";
        const req = await fetch(URL, {
            credentials: "same-origin",
        });
        const resp: AccessToken = await req.json();
        return resp;
    }

    private static async getAccessTokenFromCache(): Promise<AccessToken | null> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([SPOTIFY_ACCESS_TOKEN_KEY], (result) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
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

    private static async setAccessTokenInCache(token: AccessToken): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [SPOTIFY_ACCESS_TOKEN_KEY]: token }, () => {
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
            token = await this.fetchAccessToken();
            await this.setAccessTokenInCache(token);
        }
        return token;
    }

}
