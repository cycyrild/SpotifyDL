import { ProgressCallback } from "./helpers";
export type UIUpdateCallback = (overallProgress: number, remainingItems: number, progressDetails: { [id: string]: number }) => void;

interface FileProgressState {
    downloadProgress: number;
    decrypted: boolean;
    saved: boolean;
}

export class TrackDownloadManager {
    private progressStates: { [id: string]: FileProgressState } = {};
    private progress: { [id: string]: number } = {};

    constructor(private uiUpdateCallback: UIUpdateCallback) { }

    public initializeFile(id: string) {
        this.progressStates[id] = { downloadProgress: 0, decrypted: false, saved: false };
        this.progress[id] = 0;
    }

    public trackDownloadProgressCallback: ProgressCallback = (loaded, total, id) => {
        if (!this.progressStates[id]) {
            throw new Error("File need to be initialized first");
        }

        this.progressStates[id].downloadProgress = total > 0 ? (loaded / total) * 100 : 0;
        this.updateFileProgress(id);
        this.reportGlobalProgress();
    };

    public decryptionProgressCallback = (id: string) => {
        if (!this.progressStates[id]) {
            throw new Error("File need to be initialized first");
        }

        this.progressStates[id].decrypted = true;
        this.updateFileProgress(id);
        this.reportGlobalProgress();
    };

    public saveProgressCallback = (id: string) => {
        if (!this.progressStates[id]) {
            throw new Error("File need to be initialized first");
        }

        this.progressStates[id].saved = true;
        this.updateFileProgress(id);
        this.reportGlobalProgress();
    };

    private updateFileProgress(id: string) {
        const state = this.progressStates[id];
        let fileProgress = 0;

        fileProgress += (state.downloadProgress / 100) * (2 / 3);
        if (state.decrypted) fileProgress += 1 / 6;
        if (state.saved) fileProgress += 1 / 6;

        this.progress[id] = fileProgress;
    }

    private reportGlobalProgress() {
        const totalProgress = Object.values(this.progress).reduce((sum, progress) => sum + progress, 0);
        const totalCount = Object.keys(this.progress).length;

        const overallProgress = totalCount > 0 ? (totalProgress / totalCount * 100).toFixed(2) : '0.00';
        const remainingItems = totalCount - Object.values(this.progressStates).filter(state => state.downloadProgress === 100 && state.decrypted && state.saved).length;

        this.uiUpdateCallback(parseFloat(overallProgress), remainingItems, this.progress);
    }
}
