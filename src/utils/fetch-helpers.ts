export type ProgressCallback = (loaded: number, total: number, id: string) => void;

import { Buffer } from 'buffer';

import { RetryOptions } from './userSettings';

export async function fetchWithRetry(url: string, retryOptions: RetryOptions, init?: RequestInit): Promise<Response> {
    for (let attempt = 0; attempt <= retryOptions.retries; attempt++) {
        try {
            const response = await fetch(url, init);

            if (response.status === 429 && attempt < retryOptions.retries) {
                const retryDelay = retryOptions.delay * Math.pow(2, attempt) + Math.random() * 250;
                console.log(`Rate limited, retrying in ${retryDelay.toFixed(0)}ms`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            } else if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (attempt === retryOptions.retries || !(error instanceof Error) || (error.message && !error.message.includes('429'))) {
                throw new Error(`Failed to fetch ${url} after ${retryOptions.retries + 1} attempts: ${(error as Error).message}`);
            }

            const retryDelay = retryOptions.delay * Math.pow(2, attempt) + Math.random() * 100;
            console.error(`Error encountered, retrying in ${retryDelay.toFixed(0)}ms`, error);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    throw new Error(`Unreachable code: Should never reach here without returning a response or throwing an error`);
}

export async function fetchAsBufferProgress(url: string, downloadId: string, onProgress: ProgressCallback): Promise<Buffer> {
    const response = await fetch(url);

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