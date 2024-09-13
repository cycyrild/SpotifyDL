# SpotifyDL Chrome Extension

### ‼️ Doesn't work anymore. All widevine avd dumps revoked. ‼️
Working on a workaround... 

## Description
Allows users to download track, playlist or album Spotify from the browser.

- Using Widevine CDM: Implements Widevine's Content Decryption Module (CDM) to obtain track decryption keys.
- Integrated decryption of the protected file and addition of MP4 metadata with FFmpeg WASM.

<img src="img1.png" style="width:700px;"/>

## Installation

You have **two options** to install the extension:

1. **Download a built version from releases:**
   - Go to the [releases](https://github.com/cycyrild/SpotifyDL/releases) page.
   - Download the latest release.

    **Unzip the downloaded file:**
   - Extract the contents of the downloaded file. You should see a folder with a subfolder named `dist`.

    **Load the extension in Chrome:**
   - Open the Chrome browser and navigate to `chrome://extensions/`.
   - Enable "Developer mode" by toggling the switch in the top-right corner.
   - Click on "Load unpacked" and select the `dist` directory which contains the `manifest.json` file.


2. **Build from source:**
   - Clone the repository:
     ```sh
     git clone https://github.com/cycyrild/SpotifyDL.git
     cd SpotifyDL
     ```
   - Install the dependencies:
     ```sh
     npm install
     ```
   - Compile the project:
     ```sh
     npm run build
     ```
   - Load the extension in Chrome:
     - Open the Chrome browser and navigate to `chrome://extensions/`.
     - Enable "Developer mode" by toggling the switch in the top-right corner.
     - Click on "Load unpacked" and select the directory where the extension files are located (`dist` folder).
     
## Usage
1. Log in to your Spotify account on the Spotify web player.
2. Navigate to a track, playlist or album you want to download.
3. Click on the SpotifyDL extension icon in the Chrome toolbar.
4. The extension will analyze the current page and display the list of tracks available for download.
5. Select the tracks you want to download and click.
6. The selected tracks will be downloaded to your device with complete metadata.


## Disclaimer
This extension is for personal use only. Downloading copyrighted material without permission is against Spotify's terms of service and may violate copyright laws. Use this extension responsibly.
