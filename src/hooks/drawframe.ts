interface Subtitle {
    text: string;
    timestamp: [number, number];

}

// textUtils.ts
export function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    let words = text.split(' ');
    let lines: string[] = [];
    let currentLine = words.shift() || ''; // Using logical OR for fallback

    while (words.length > 0) {
        let word = words.shift()!;
        if (context.measureText(currentLine + " " + word).width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// ...

interface SubtitleProgress {
  lines: string[];
  currentLineIndex: number;
  wordIndex: number;
  startTime: number;
  endTime: number;
}

function applyWordEffect(ctx: CanvasRenderingContext2D, word: string, x: number, y: number, effect: string) {
    if (effect === 'popIn') {
    popInEffect(ctx, word, x, y);
  } else {
    // Default effect: fill the text without any animation
    ctx.fillText(word, x, y);
  }
}

function popInEffect(ctx: CanvasRenderingContext2D, word: string, x: number, y: number) {
  const duration = 200; // Duration of the animation in milliseconds
  const startTime = performance.now();
  const startScale = 0.2;
  const endScale = 1.4;
  const shadowOffset = 2;
  const shadowBlur = 4;

  function animate() {
    const elapsedTime = performance.now() - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const scale = startScale + (endScale - startScale) * progress;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowOffsetX = shadowOffset;
    ctx.shadowOffsetY = shadowOffset;
    ctx.shadowBlur = shadowBlur * progress;
    ctx.fillText(word, 0, 0);
    ctx.restore();

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

export function drawSubtitles(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, subtitles: Subtitle[], canvas: HTMLCanvasElement): [string[], number, number, number, number] {
  const currentSubtitle = subtitles.find(sub => video.currentTime >= sub.timestamp[0] && video.currentTime <= sub.timestamp[1]);
  if (currentSubtitle) {
    const lines = wrapText(ctx, currentSubtitle.text, canvas.width * (2 / 3));
    return [lines, 0, 0, currentSubtitle.timestamp[0], currentSubtitle.timestamp[1]];
  }
  return [[], 0, 0, 0, 0];
}

const createDrawFrame = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  subtitles: Subtitle[],
  callback: () => void,
  effect: string = 'none'
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  ctx.font = '30px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';

  let currentSubtitleIndex = -1;
  let subtitleProgress: SubtitleProgress = {
    lines: [],
    currentLineIndex: 0,
    wordIndex: 0,
    startTime: 0,
    endTime: 0,
  };

  return function drawFrame() {
    if (video.ended) {
      callback();
      return;
    }
    if (video.paused || video.ended) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const newSubtitleIndex = subtitles.findIndex(sub => video.currentTime >= sub.timestamp[0] && video.currentTime <= sub.timestamp[1]);

    if (newSubtitleIndex !== currentSubtitleIndex) {
      currentSubtitleIndex = newSubtitleIndex;
      if (currentSubtitleIndex !== -1) {
        const [lines, currentLineIndex, wordIndex, startTime, endTime] = drawSubtitles(ctx, video, subtitles, canvas);
        subtitleProgress = {
          lines,
          currentLineIndex,
          wordIndex,
          startTime,
          endTime,
        };
      } else {
        subtitleProgress = {
          lines: [],
          currentLineIndex: 0,
          wordIndex: 0,
          startTime: 0,
          endTime: 0,
        };
      }
    }

    if (currentSubtitleIndex !== -1 && subtitleProgress.lines.length > 0) {
      const words = subtitleProgress.lines[subtitleProgress.currentLineIndex].split(' ');
      const elapsedTime = video.currentTime - subtitleProgress.startTime;
      const subtitleDuration = subtitleProgress.endTime - subtitleProgress.startTime;
      const wordsPerSecond = words.length / subtitleDuration;
      const targetWordIndex = Math.floor(elapsedTime * wordsPerSecond);

      if (targetWordIndex >= subtitleProgress.wordIndex && targetWordIndex < words.length) {
        const word = words[targetWordIndex];
          const previousWords = words.slice(0, targetWordIndex).join(' ');
          const padding = 10;
          
        const x = 10 + ctx.measureText(previousWords).width + padding;
        const y = canvas.height - 50;

        // Draw the previously printed words
        ctx.fillText(previousWords, 10, y);

        // Apply the effect to the new word
        applyWordEffect(ctx, word, x, y, effect);

        subtitleProgress.wordIndex = targetWordIndex;

        if (subtitleProgress.wordIndex === words.length - 1) {
          subtitleProgress.currentLineIndex++;
          subtitleProgress.wordIndex = 0;
        }

        if (subtitleProgress.currentLineIndex >= subtitleProgress.lines.length) {
          subtitleProgress.currentLineIndex = subtitleProgress.lines.length - 1;
          subtitleProgress.wordIndex = words.length - 1;
        }
      }
    }

    requestAnimationFrame(drawFrame);
  };
};

export {createDrawFrame};
