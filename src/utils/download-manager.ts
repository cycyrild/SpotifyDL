import { ProgressCallback } from "./helpers";

export type UIUpdateCallback = (
    overallProgress: number,
    remainingItems: number,
    progressStates: { [id: string]: FileProgressStateImpl }
) => void;

interface FileProgressState {
    downloadProgress: number;
    decrypted: boolean;
    saved: boolean;
    finished: boolean;
    progress(): number;
}

export class FileProgressStateImpl implements FileProgressState {
    downloadProgress: number = 0;
    decrypted: boolean = false;
    saved: boolean = false;
    finished: boolean = false;

    percentageProgress(): string {
        return (this.progress() * 100).toFixed(2);
    }

    progress(): number {
        let fileProgress = 0;
        fileProgress += (this.downloadProgress / 100) * (2 / 3);
        if (this.decrypted) fileProgress += 1 / 6;
        if (this.saved) fileProgress += 1 / 6;
        return fileProgress;
    }

    complete(): boolean {
        return this.downloadProgress === 100 && this.decrypted && this.saved;
    }
}

export class TrackDownloadManager {
    private progressStates: { [id: string]: FileProgressStateImpl } = {};

    constructor(private uiUpdateCallback: UIUpdateCallback) { }

    public initializeFile(id: string) {
        if (this.progressStates[id] && !this.progressStates[id].complete()) {
            throw new Error("File initialized and not completed");
        }
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
        const activeStates = Object.values(this.progressStates).filter(state => !state.finished);

        const totalProgress = activeStates.reduce((sum, state) => sum + state.progress(), 0);
        const totalCount = activeStates.length;
        const overallProgress = totalCount > 0 ? (totalProgress / totalCount * 100).toFixed(2) : '0.00';
        const remainingItems = activeStates.filter(state => !state.complete()).length;

        Object.values(this.progressStates).forEach(state => {
            if (state.complete() && !state.finished) {
                state.finished = true;
            }
        });

        this.uiUpdateCallback(parseFloat(overallProgress), remainingItems, this.progressStates);
    }
}