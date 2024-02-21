// Assuming the use of ES Modules in your TypeScript configuration
// @ts-ignore
import { pipeline } from "@xenova/transformers";

interface WorkerMessageEvent extends MessageEvent {
  data: {
    status: string;
    audio?: ArrayBuffer; // Assuming audio data is passed as an ArrayBuffer
    windowStart?: number;
  };
}

let transcriber: any;

async function initWorker(): Promise<void> {
  transcriber = await pipeline(
    "automatic-speech-recognition",
    "openai/whisper-tiny.en",
    {
      progress_callback: (progress: number) => {
        postMessage({ status: "progress", progress });
      },
    }
  );
  postMessage({ status: "workerReady" });
}

onmessage = async (e: WorkerMessageEvent) => {
  switch (e.data.status) {
    case "audioReady":
      if (e.data.audio) {
        const result: any = await transcriber(e.data.audio, {
          chunk_length_s: 30,
          temperature: 0.4,
        });
        postMessage({
          status: "transcriptReady",
          transcript: result,
          windowStart: e.data.windowStart,
        });
      }
      break;
    // You can handle more cases here if needed
  }
};

initWorker();
