## SpotifyDL Chrome Extension

### Description
The Spotify Music Downloader Chrome Extension allows users to download tracks from their Spotify playlists directly to their device using their Spotify account (premium or free). By analyzing the current Spotify page, the extension extracts the track information, retrieves complete metadata (including album cover, artist, and album info), and downloads the files directly from Spotify's servers.

**Note: Currently, downloads are limited to 128kbps quality (Spotify Free quality) due to the lack of a Spotify Premium account for development and testing. Higher quality downloads will be supported in future updates.**

![img1](img1.png)

### Features
- Download tracks from Spotify playlists.
- Supports both premium and free Spotify accounts.
- Retrieves and includes complete metadata (album cover, artist, album information).
- Direct download from Spotify servers audio files.

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/cycyrild/SpotifyDl.git
   cd spotifyDl
   ```

2. Install the dependencies:
   ```sh
     npm install
   ```

4. Compile the project:
   ```sh
   npm run proto
   npm run build
   ```

5. Load the extension in Chrome:
   - Open the Chrome browser and navigate to `chrome://extensions/`.
   - Enable "Developer mode" by toggling the switch in the top-right corner.
   - Click on "Load unpacked" and select the directory where the extension files are located (`dist` folder).

### Usage
1. Log in to your Spotify account (premium or free) on the Spotify web player.
2. Navigate to a playlist you want to download.
3. Click on the Spotify Music Downloader extension icon in the Chrome toolbar.
4. The extension will analyze the current page and display the list of tracks available for download.
5. Select the tracks you want to download and click the "Download" button.
6. The selected tracks will be downloaded to your device with complete metadata.


### Disclaimer
This extension is for personal use only. Downloading copyrighted material without permission is against Spotify's terms of service and may violate copyright laws. Use this extension responsibly.
