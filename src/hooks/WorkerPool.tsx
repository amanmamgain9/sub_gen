interface Subtitle {
    start: number;
    end: number;
    text: string;
}

interface WorkerMessage {
    subtitle?: Subtitle;
}

interface SubtitleTask {
    currentTime: number;
    subtitles: Subtitle[];
}



class WorkerPool {
    queue: SubtitleTask[] = [];
    workers: { worker: Worker; busy: boolean }[] = [];

    constructor(workerScript: string, numberOfWorkers: number) {
        this.workers = Array.from({ length: numberOfWorkers }, () => {
            const worker = new Worker(workerScript);
            worker.onmessage = (e: MessageEvent) => {
                this.onWorkerMessage(e);
            };
            return { worker, busy: false };
        });
    }

    onWorkerMessage(e: MessageEvent<WorkerMessage>) {
        const workerIndex = this.workers.findIndex(w => w.worker === e.target);
        if (workerIndex !== -1) {
            this.workers[workerIndex].busy = false;
        }
        this.executeNextTask();
    }
    
    enqueueTask(task: SubtitleTask) {
        this.queue.push(task);
        this.executeNextTask();
    }
    
    executeNextTask() {
        const availableWorker = this.workers.find(w => !w.busy);
        if (availableWorker && this.queue.length > 0) {
            const task = this.queue.shift();
            availableWorker.busy = true;
            availableWorker.worker.postMessage(task);
        }
    }
}
export default WorkerPool;
