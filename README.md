# SpotifyDL Chrome Extension

<img src="img1.png" style="width:700px;"/>

## Description
Allows users to download track, playlist or album Spotify from the browser.

- Using **PlayPlay CDM** for **Ogg/Vorbis (96, 160, 320 Kbits/s)**. *[source](https://git.gay/uhwot/unplayplay)*

- Using **Widevine CDM** for **AAC (128, 256 Kbits/s)**.

- **Integrated decryption** of the protected file and addition of metadata with **FFmpeg WASM**.

- Supports **parallel downloads**.


> **Widevine decryption requires a valid Widevine device** (RSA Private Key (PEM or DER) and Client ID Blob).

> *For any comments, bug reports or other ... please contact me on **Discord: cyril13600***

### Project To-Do List

[~] *Done for PlayPlay* - **Migrate decryption from node-forge to WebCrypto for Widevine** to improve performance and prevent UI freezing.

[&check;] **Add user settings for audio container and codec selection**  
  Allow users to choose the audio container and/or codec when using FFmpeg by adding corresponding settings in the user interface.

[&check;] **Improve error logging and add user-friendly error popups**  
  Enhance error logging mechanisms and implement UI popups that inform users of errors in a clear and user-friendly way.



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
