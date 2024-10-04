import { Settings } from "./userSettings";

export class DownloadQueue<T> {
    private settings: React.MutableRefObject<Settings>;
    private runningTasks: number = 0;
    private taskQueue: Array<() => void> = []; // Modifier le type pour () => void
  
    constructor(settings: React.MutableRefObject<Settings>) {
      this.settings = settings;
    }
  
    async addTasks(tasks: Array<() => Promise<T>>): Promise<T[]> {
      const taskPromises = tasks.map((task) => this.enqueueTask(task));
      return Promise.all(taskPromises);
    }
  
    private enqueueTask(task: () => Promise<T>): Promise<T> {
      return new Promise((resolve, reject) => {
        const runTask = async () => {
          if (this.runningTasks >= this.settings.current.maxDownloadConcurrency) {
            this.taskQueue.push(runTask);
            return;
          }
  
          this.runningTasks++;
          try {
            const result = await task();
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.runningTasks--;
            if (this.taskQueue.length > 0) {
              const nextTask = this.taskQueue.shift();
              if (nextTask) nextTask();
            }
          }
        };
  
        runTask();
      });
    }
      
}
