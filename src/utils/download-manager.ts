import { ProgressCallback } from "./fetch-helpers";

export type UIUpdateCallback = (
    overallProgress: number,
    remainingItems: number,
    progressStates: { [id: string]: FileProgressState }
) => void;

export class FileProgressState {
    downloadProgress: number = 0;
    encodingProgress: number = 0;
    saved: boolean = false;
    finished: boolean = false;
    error: boolean = false;

    percentageProgress(): string {
        return (this.progress() * 100).toFixed(2);
    }

    progress(): number {
        let fileProgress = 0;
        fileProgress += (this.downloadProgress / 100) * 0.7; // 70%
        fileProgress += (this.encodingProgress / 100) * 0.2875; // 28.75%
        if (this.saved) {
            fileProgress += 0.0125; // 1.25%
        }
        return fileProgress;
    }

    complete(): boolean {
        return (this.downloadProgress === 100 && this.encodingProgress === 100 && this.saved) || this.error;
    }
}


export class TrackDownloadManager {
    private progressStates: { [id: string]: FileProgressState } = {};

    constructor(private uiUpdateCallback: UIUpdateCallback) { }

    public initializeFiles(ids: Set<string>) {
        ids.forEach(id =>{
            if (this.progressStates[id] && !this.progressStates[id].complete()) {
                throw new Error("File initialized and not completed");
            }
            this.progressStates[id] = new FileProgressState();
        });
        this.reportGlobalProgress();
    }

    public trackDownloadProgressCallback: ProgressCallback = (loaded, total, id) => {
        if (!this.progressStates[id]) {
            throw new Error("File needs to be initialized first");
        }

        this.progressStates[id].downloadProgress = total > 0 ? (loaded / total) * 100 : 0;
        this.reportGlobalProgress();
    };

    public encodingProgressCallback = (id: string, loaded: number) => {
        if (!this.progressStates[id]) {
            throw new Error("File needs to be initialized first");
        }

        this.progressStates[id].encodingProgress = loaded;
        this.reportGlobalProgress();
    };

    public saveProgressCallback = (id: string) => {
        if (!this.progressStates[id]) {
            throw new Error("File needs to be initialized first");
        }

        this.progressStates[id].saved = true;
        this.reportGlobalProgress();
    };

    public errorProgressCallback = (id: string) => {
        if (!this.progressStates[id]) {
            throw new Error("File needs to be initialized first");
        }

        this.progressStates[id].error = true;
        this.reportGlobalProgress();
    };

    public finishedCallback = (id: string) => {
        if (!this.progressStates[id]) {
            throw new Error(`File with id ${id} needs to be initialized first`);
        }
        this.progressStates[id].finished = true;
    
        this.reportGlobalProgress();
    }
    

    private reportGlobalProgress() {
        const activeStates = Object.values(this.progressStates).filter(state => !state.finished && !state.error);

        const totalProgress = activeStates.reduce((sum, state) => sum + state.progress(), 0);
        const totalCount = activeStates.length;
        const overallProgress = totalCount > 0 ? (totalProgress / totalCount * 100).toFixed(2) : '0.00';
        const remainingItems = activeStates.filter(state => !state.complete()).length;

        this.uiUpdateCallback(parseFloat(overallProgress), remainingItems, this.progressStates);
    }
}
