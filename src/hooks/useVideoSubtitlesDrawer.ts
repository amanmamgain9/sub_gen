import { useEffect, useRef, useCallback } from 'react';

interface Subtitle {
  start: number;
  end: number;
  text: string;
}

// Standalone function to draw text
const drawText = (text: string, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  ctx.font = '20px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height - 30); // Adjust positioning as needed
};

export const useVideoSubtitlesDrawer = (videoSrc: string, subtitles: Subtitle[]) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null as any);

  // Function to play video frame by frame quickly, wrapped in useCallback
  const playVideoWithSubtitles = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = 16; // Adjust based on your needs
    video.play();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !videoSrc) return;

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

    const drawFrame = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };

    video.addEventListener('timeupdate', () => {
      drawFrame();
      const currentTime = video.currentTime;
      const subtitle = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);
      const ctx = canvasRef.current?.getContext('2d');
      if (subtitle && ctx && canvasRef.current) {
        drawText(subtitle.text, ctx, canvasRef.current);
      }
    });

    // Auto-start video playback; remove if manual control is preferred
    playVideoWithSubtitles();

    return () => {
      video.pause();
      videoRef.current = null;
    };
  }, [videoSrc, subtitles, playVideoWithSubtitles]);

  return { videoRef, canvasRef, playVideoWithSubtitles };
};
export default useVideoSubtitlesDrawer;
