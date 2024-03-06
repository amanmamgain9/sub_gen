import { useEffect, useRef, useCallback } from 'react';

import WorkerPool from './WorkerPool';

// Assume WorkerPool and interfaces are defined in the same file or imported

interface Subtitle {
    start: number;
    end: number;
    text: string;
}

interface WorkerMessage {
    subtitle?: Subtitle;
}

export const useVideoSubtitlesDrawer = (
    videoSrc: string,
    stopRecordingCallback: (blob: Blob) => void
) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const workerPoolRef = useRef<WorkerPool | null>(null);

    useEffect(() => {
        const workerScriptUrl = new URL('../subtitleWorker.js', import.meta.url);

        //workerPoolRef.current = new WorkerPool('src/subtitleWorker.js', 4);
        workerPoolRef.current = new WorkerPool(workerScriptUrl.toString(), 4);

        workerPoolRef.current.workers.forEach(({ worker }) => {
            worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
                const { subtitle } = e.data;
                requestAnimationFrame(() => {
                    const canvas = canvasRef.current;
                    const ctx = canvas?.getContext('2d');
                    if (canvas && ctx && subtitle) {
                        drawText(
                            subtitle.text, ctx,
                            canvas);
                    }
                });
            };
        });

        return () => {
            workerPoolRef.current?.workers.forEach(({ worker }) => worker.terminate());
        };
    }, []);

    const drawText = useCallback((text: string, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        ctx.clearRect(0, canvas.height - 40, canvas.width, 40); // Clear previous subtitles
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(text, canvas.width / 2, canvas.height - 10);
    }, []);

    const playVideoWithSubtitles = useCallback(async (subtitles: Subtitle[]) => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        video.play();

        const onTimeUpdate = () => {
            const currentTime = video.currentTime;
            workerPoolRef.current?.enqueueTask({ currentTime, subtitles });
        };

        video.addEventListener('timeupdate', onTimeUpdate);

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
        };
    }, []);

    useEffect(() => {
        if (!videoSrc) return;

        const video = document.createElement('video');
        videoRef.current = video;
        video.src = videoSrc;
        video.load();

        video.addEventListener('loadedmetadata', () => {
            if (canvasRef.current) {
                canvasRef.current.width = video.videoWidth;
                canvasRef.current.height = video.videoHeight;
            }
        });

        return () => {
            video.pause();
            videoRef.current = null;
        };
    }, [videoSrc]);

    return { videoRef, canvasRef, playVideoWithSubtitles };
};

export default useVideoSubtitlesDrawer;


