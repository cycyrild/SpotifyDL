import { Settings } from "./userSettings";

export class DownloadQueue<T> {
    private queue: Array<() => Promise<T>> = [];
    private activeCount: number = 0;
    private settings : React.MutableRefObject<Settings>

    public constructor(settings: React.MutableRefObject<Settings>) {
        this.settings = settings;
    }

    public enqueue(tasks: Array<() => Promise<T>>): Promise<void> {
        tasks.forEach(task => this.queue.push(task));

        return new Promise((resolve, reject) => {
            const checkIfAllDone = () => {
                if (this.activeCount === 0 && this.queue.length === 0) {
                    resolve();
                }
            };

            const processQueue = async () => {
                while (this.activeCount < this.settings.current.maxDownloadConcurency && this.queue.length > 0) {
                    const task = this.queue.shift();
                    if (task) {
                        this.activeCount++;
                        try {
                            await task();
                        } catch (error) {
                            this.activeCount--;
                            reject(error);  // Reject the main promise if any task fails
                        } finally {
                            this.activeCount--;
                            processQueue().catch(error => {
                                console.error("Error processing queue in finally:", error);
                                reject(error);  // Also reject if there's an error in processing
                            });
                            checkIfAllDone();
                        }
                    }
                }
            };

            processQueue().catch(error => reject(error));

            checkIfAllDone();
        });
    }
}
