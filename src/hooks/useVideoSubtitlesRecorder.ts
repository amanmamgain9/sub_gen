import { useCallback, useEffect, useRef } from 'react';

interface Subtitle {
  text: string;
  timestamp: [number, number];
}

export const useVideoSubtitlesRecorder = (videoSrc: string) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = videoSrc;
    }
  }, [videoSrc]);

  const playVideoWithSubtitles = useCallback(async (subtitles: Subtitle[]) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stream = canvas.captureStream(25); // Capture at 25 FPS
    recorderRef.current = new MediaRecorder(stream);
    recordedChunksRef.current = [];

    recorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recordedVideoWithSubtitles.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    video.play();
    recorderRef.current.start();

    const drawFrame = () => {
      if (video.paused || video.ended) {
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentSubtitle = subtitles.find(sub => video.currentTime >= sub.timestamp[0] && video.currentTime <= sub.timestamp[1]);
      if (currentSubtitle) {
        // Example styling for subtitles
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(currentSubtitle.text, canvas.width / 2, canvas.height - 30); // Adjust as needed
      }

      requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return new Promise<void>((resolve) => {
      video.onended = () => {
        recorderRef.current?.stop();
        resolve();
      };
    });
  }, []);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
    };
  }, []);

  return { videoRef, canvasRef, playVideoWithSubtitles };
};
export default useVideoSubtitlesRecorder;
