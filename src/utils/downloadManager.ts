export type UIUpdateCallback = (overallProgress: number, remainingItems: number, progressDetails: { [id: string]: number }) => void;
import { ProgressCallback } from "./helpers";

interface FileProgressState {
    downloadProgress: number;
    decrypted: boolean;
    saved: boolean;
    calculateProgress(): number;
}

class FileProgressStateImpl implements FileProgressState {
    downloadProgress: number = 0;
    decrypted: boolean = false;
    saved: boolean = false;

    calculateProgress(): number {
        let fileProgress = 0;
        fileProgress += (this.downloadProgress / 100) * (2 / 3);
        if (this.decrypted) fileProgress += 1 / 6;
        if (this.saved) fileProgress += 1 / 6;
        return fileProgress;
    }

    complete(): boolean {
        return this.downloadProgress == 100 && this.decrypted && this.saved;
    }
}

export class TrackDownloadManager {
    private progressStates: { [id: string]: FileProgressStateImpl } = {};

    constructor(private uiUpdateCallback: UIUpdateCallback) { }

    public initializeFile(id: string) {
        this.progressStates[id] = new FileProgressStateImpl();
        this.reportGlobalProgress();
    }

    public trackDownloadProgressCallback: ProgressCallback = (loaded, total, id) => {
        if (!this.progressStates[id]) {
            throw new Error("File needs to be initialized first");
        }

        this.progressStates[id].downloadProgress = total > 0 ? (loaded / total) * 100 : 0;
        this.reportGlobalProgress();
    };

    public decryptionProgressCallback = (id: string) => {
        if (!this.progressStates[id]) {
            throw new Error("File needs to be initialized first");
        }

        this.progressStates[id].decrypted = true;
        this.reportGlobalProgress();
    };

    public saveProgressCallback = (id: string) => {
        if (!this.progressStates[id]) {
            throw new Error("File needs to be initialized first");
        }

        this.progressStates[id].saved = true;
        this.reportGlobalProgress();
    };

    private reportGlobalProgress() {
        const progressDetails: { [id: string]: number } = {};
        const totalProgress = Object.keys(this.progressStates).reduce((sum, id) => {
            const progress = this.progressStates[id].calculateProgress();
            progressDetails[id] = progress;
            return sum + progress;
        }, 0);

        const totalCount = Object.keys(this.progressStates).length;
        const overallProgress = totalCount > 0 ? (totalProgress / totalCount * 100).toFixed(2) : '0.00';
        const remainingItems = totalCount - Object.values(this.progressStates).filter(state => state.complete()).length;

        this.uiUpdateCallback(parseFloat(overallProgress), remainingItems, progressDetails);
    }
}
