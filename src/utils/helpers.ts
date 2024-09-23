//import { FileDownloadData } from "./fetch-helpers";

export async function limitedPromiseAll<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  let currentIndex = 0;
  let activePromises = 0;

  return new Promise((resolve, reject) => {
    const enqueue = () => {
      if (currentIndex === tasks.length && activePromises === 0) {
        return resolve(results);
      }

      while (activePromises < limit && currentIndex < tasks.length) {
        const taskIndex = currentIndex++;
        activePromises++;
        tasks[taskIndex]()
          .then((result) => {
            results[taskIndex] = result;
          })
          .catch(reject)
          .finally(() => {
            activePromises--;
            enqueue();
          });
      }
    };

    enqueue();
  });
}

/*export function toHexString(byteArray: Uint8Array): string {
  return Array.from(byteArray, (byte: number) => {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}*/

export function chromeDownload(file: Uint8Array, extension: string, name: string) {

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
    const forbiddenCharacters = /[<>:"/\\|?*.]/g;
    return filename.replace(forbiddenCharacters, '');
  }

  const blob = new Blob([file], { type: `audio/${extension}` });
  const blobUrl = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: blobUrl,
    filename: `${sanitizeFilename(name)}.${extension}`,
  },
    (downloadId: number) => {
      DownloadCallback(downloadId, blobUrl);
    }
  );
}