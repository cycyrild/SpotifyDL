export class SpotifyAuth {
    private static async getAllCookies(): Promise<chrome.cookies.Cookie[]> {
        return new Promise((resolve, reject) => {
            chrome.cookies.getAll({}, (cookies) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(cookies);
                }
            });
        });
    }

    public static async getSpotifyCookie(): Promise<string | null> {
        const cookies = await this.getAllCookies();
        const sp_dc_cookie = cookies.find(cookie => cookie.name === 'sp_dc');
        return sp_dc_cookie ? sp_dc_cookie.value : null;
    }

    public static async getAccessToken(cookie: string): Promise<string> {
        const URL = "https://open.spotify.com/get_access_token";

        const req = await fetch(URL, {
            headers: {
                cookie: `sp_dc=${cookie}`
            }
        });
        const resp = await req.json();

        if (!resp.accessToken)
            throw new Error("Failed to retrieve token from response");

        return resp.accessToken;
    }
}