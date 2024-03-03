import { useCallback, useEffect, useRef } from 'react';
import RecordRTC from 'recordrtc'; // Import RecordRTC
import {preProcessSubtitles} from '../utils/SubtitleUtils';
import FFmpegUtil from '../utils/FfmpegUtils';
interface Subtitle {
    text: string;
    timestamp: [number, number];
}


// Improved wrapText function
function wrapText(context:any, text:any, maxWidth:any, nextChar:any) {
    const words = text.split(' ');
    let line = '';
    let lines = [];

    words.forEach((word:string, index:number) => {
        const testLine = line + word + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        const isLastWord = index === words.length - 1;
        const nextWord = words[index + 1] || '';
        const futureLine = testLine + nextWord;
        const futureWidth = context.measureText(futureLine).width;

        // Check if adding next word exceeds maxWidth or if it's the last word
        if ((futureWidth > maxWidth && !isLastWord && nextChar !== ' ') || (isLastWord && testWidth <= maxWidth)) {
            lines.push(testLine.trim());
            line = '';
        } else if (line !== '') {
            line = testLine;
        } else {
            lines.push(word);
        }
    });

    if (line) {
        lines.push(line.trim()); // Make sure to add any residual text
    }

    return lines;
}


const createDrawFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement, subtitles: Subtitle[], callback:any) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get canvas context');
    }
    
    return function drawFrame (){
        if (video.ended) {
            callback(); // Stop recording when video ends
            return; // Exit the drawFrame loop
        }
        if (video.paused || video.ended) {
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const currentSubtitle = subtitles.find(sub => video.currentTime >= sub.timestamp[0] && video.currentTime <= sub.timestamp[1]);
        
        if (currentSubtitle) {
            const elapsedTime = video.currentTime - currentSubtitle.timestamp[0];
            const subtitleDuration = currentSubtitle.timestamp[1] - currentSubtitle.timestamp[0];
            const totalChars = currentSubtitle.text.length;
            const charsPerSecond = totalChars / subtitleDuration;
            let charsToShow = Math.floor(charsPerSecond * elapsedTime);
            charsToShow = Math.min(
                charsToShow, totalChars);

            const textToShow = (
                currentSubtitle.text.substr(
                    0, charsToShow));
            console.log('textToShow', textToShow);
            const lines = wrapText(ctx, textToShow, canvas.width * 0.8, currentSubtitle.text[charsToShow]);
            console.log('lines', lines);
            let startY = canvas.height * 0.1; // Starting Y coordinate for the first line of subtitles
            
            // Drawing the text line by line
            ctx.font = '30px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            lines.forEach(line => {
                ctx.fillText(line, canvas.width / 2, startY);
                startY += 30; // Adjust for line height, increase Y to move to the next line downwards
            });
        }
        requestAnimationFrame(drawFrame);
    }
};

export const useVideoSubtitlesRecorder = (videoSrc: string) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const recorderRef = useRef<RecordRTC | null>(null);
    const recordedChunksRef = useRef<BlobPart[]>([]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.src = videoSrc;
        }
    }, [videoSrc]);

    
    const playVideoWithSubtitles = useCallback(async (subtitles: Subtitle[]) => {
        subtitles = preProcessSubtitles(
            subtitles);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const stream = canvas.captureStream(25); // Capture at 25 FPS
        recorderRef.current = new RecordRTC(stream, {
            type: 'video',
            mimeType: 'video/webm;codecs=h264', // Specify desired output format
            bitsPerSecond: 25000000,
            videoBitsPerSecond: 25000000,
            frameRate: 30,
        });
        recordedChunksRef.current = [];

        const stopRecordingCallback = () => {
            (recorderRef.current as RecordRTC).stopRecording(async () => {
                const ffmpeg = await FFmpegUtil.getFFmpegInstance();

                const blob = (recorderRef.current as RecordRTC).getBlob();
                console.log('blob', blob);
                const buffer = await blob.arrayBuffer();
                console.log('buffer', buffer);
                const uint8Array = new Uint8Array(buffer);
                console.log('uint8Array0', uint8Array);
                console.log('uint8Array01', uint8Array);
                await ffmpeg.writeFile('input.webm', uint8Array);
                console.log('uint8Array', uint8Array);
                // check input.mp4 file
                const inputUint8Array = await ffmpeg.readFile('input.webm');
                console.log('inputUint8Array read', inputUint8Array);
                await ffmpeg.exec([
                    '-i', 'input.webm',    // Input file
                    '-c:v', 'copy',        // Copy video stream as is
                    '-c:a', 'copy',        // Copy audio stream as is
                    '-movflags', 'faststart', // Move metadata to the beginning for faster start
                    'output.mp4'           // Output file
                ]);

                const processedUint8Array = await ffmpeg.readFile('output.mp4');
                console.log('processedUint8Array', processedUint8Array);
                const processedBlob = new Blob([processedUint8Array], { type: 'video/mp4' });
                console.log('processedBlob', processedBlob);
                const url = URL.createObjectURL(processedBlob);



                //const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'recordedVideoWithSubtitles.mp4';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        };

        video.play();
        recorderRef.current.startRecording();
        //recorderRef.current.start();

        video.addEventListener('play', () => {
            const drawFrame = createDrawFrame(
                video, canvas, subtitles, stopRecordingCallback);
            drawFrame(); // Start drawing frames only when video starts playing
    });
    }, []);

    useEffect(() => {
        return () => {
            recorderRef.current?.stopRecording();
        };
    }, []);

    return { videoRef, canvasRef, playVideoWithSubtitles };
};
export default useVideoSubtitlesRecorder;



