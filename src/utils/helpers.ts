import { Buffer } from "buffer";
import { lookup as mimeLookup } from 'mime-types';
import { fileTypeFromBuffer, FileTypeResult } from 'file-type';

export type ProgressCallback = (loaded: number, total: number, id: string) => void;


export type FileDownloadData<T> = {
  arrayBuffer: T;
  mimetype: string;
  extension: string;
};

export function toHexString(byteArray: Uint8Array): string {
  return Array.from(byteArray, (byte: number) => {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

export async function fetchAsBufferProgress(url: string, downloadId: string, onProgress: ProgressCallback): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get reader from response body');
  }

  let loaded = 0;
  const chunks: Uint8Array[] = [];
  const progressUpdateThreshold = 1024 * 500;
  let lastProgressUpdate = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (value) {
      chunks.push(value);
      loaded += value.length;

      if (loaded - lastProgressUpdate >= progressUpdateThreshold || loaded === total) {
        onProgress(loaded, total, downloadId);
        lastProgressUpdate = loaded;
      }
    }
  }

  const buffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk.buffer)));

  return buffer;
}

export async function fetchAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer;
}

export async function fetchUrlAsFileDataProgress(url: string, downloadId: string, onProgress: ProgressCallback): Promise<FileDownloadData<Buffer>> {

  const buffer = await fetchAsBufferProgress(url, downloadId, onProgress);

  const fileType: FileTypeResult | undefined = await fileTypeFromBuffer(buffer);

  let mimetype: string | null = null;
  let extension: string | null = null;

  if (fileType) {
    mimetype = fileType.mime;
    extension = fileType.ext;
  }
  else
    throw new Error(`No mimetype found for ${url}`)

  return { arrayBuffer: buffer, mimetype, extension };
}

export async function fetchUrlAsFileData(url: string): Promise<FileDownloadData<Buffer>> {
  const buffer = await fetchAsBuffer(url);

  const fileType: FileTypeResult | undefined = await fileTypeFromBuffer(buffer);

  let mimetype: string | null = null;
  let extension: string | null = null;

  if (fileType) {
    mimetype = fileType.mime;
    extension = fileType.ext;
  }
  else
    throw new Error(`No mimetype found for ${url}`)

  return { arrayBuffer: buffer, mimetype, extension };
}


export function chromeDownload(file: FileDownloadData<Uint8Array>, title: string) {

  function DownloadCallback(downloadId: number, blobUrl: string) {
    if (downloadId) {
      chrome.downloads.onChanged.addListener(function (delta) {
        if (delta.id === downloadId && delta.state && delta.state.current === 'complete') {
          console.log('Download completed!');
          URL.revokeObjectURL(blobUrl);
        }
      });
    } else {
      console.error('Download failed.');
      URL.revokeObjectURL(blobUrl);
    }
  }

  function sanitizeFilename(filename: string): string {
    const forbiddenCharacters = /[<>:"\/\\|?*\x00-\x1F]/g;
    return filename.replace(forbiddenCharacters, '');
  }



  const blob = new Blob([file.arrayBuffer], { type: file.mimetype });

  var blobUrl = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: blobUrl,
    filename: sanitizeFilename(`${title}.${file.extension}`)
  },
    (downloadId: number) => {
      DownloadCallback(downloadId, blobUrl);
    }
  );
}
