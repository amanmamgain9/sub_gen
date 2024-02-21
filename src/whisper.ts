// Assuming the use of ES Modules in your TypeScript configuration
// If you're using specific types for messages, define them directly in this file.
interface WorkerProgressMessage {
    status: 'progress';
    progress: number;
}

interface WorkerReadyMessage {
    status: 'workerReady';
}

interface WorkerTranscriptReadyMessage {
    status: 'transcriptReady';
    transcript: string; // Adjust according to the actual structure
    windowStart?: number;
}

// Combine the message types into a union type for handling all worker messages
type WorkerMessage = WorkerProgressMessage | WorkerReadyMessage | WorkerTranscriptReadyMessage;

export default class Whisper {
    private worker: Worker | null;

    constructor() {
        this.worker = null;
    }

    init(onProgress: (progress: number) => void, onResult: (data: WorkerTranscriptReadyMessage) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            // Import the worker script as a module using Webpack or your preferred bundler setup
            // Note: The type 'module' might not be necessary depending on your build setup
            this.worker = new Worker(new URL("./whisper-worker.js", import.meta.url), { type: 'module' });

            this.worker.onmessage = (e: MessageEvent) => {
                const data: WorkerMessage = e.data;

                switch (data.status) {
                    case "progress":
                        onProgress(data.progress);
                        break;
                    case "workerReady":
                        resolve();
                        break;
                    case "transcriptReady":
                        onResult(data as WorkerTranscriptReadyMessage);
                        break;
                }
            };

            this.worker.onerror = (e) => {
                console.error('Worker error:', e);
                reject(e);
            };
        });
    }

    sendAudioToWorker(audioBuffer: AudioBuffer, windowStart?: number): void {
        if (!this.worker) {
            console.error("Worker not initialized");
            return;
        }

        this.worker.postMessage({ status: "audioReady", audio: audioBuffer, windowStart });
    }

    // Methods to manage worker lifecycle if necessary
    terminateWorker(): void {
        this.worker?.terminate();
        this.worker = null;
    }
}
