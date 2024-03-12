import { useCallback, useEffect, useRef } from 'react';
import RecordRTC from 'recordrtc'; // Import RecordRTC
import {preProcessSubtitles} from '../utils/SubtitleUtils';
import FFmpegUtil, {getVideoProperties} from '../utils/FfmpegUtils';

import {createDrawFrame} from './drawframe';

interface Subtitle {
    text: string;
    timestamp: [number, number];
}




interface DrawFrameCallback {
    (): void;
}


interface DrawFrameCallback {
  (): void;
}



export const useVideoSubtitlesRecorder = (videoSrc: string, onRecordingComplete: (blob: Blob) => void, videoType:string) => {
    const localVideoSrc = useRef(videoSrc);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const recorderRef = useRef<RecordRTC | null>(null);
    const recordedChunksRef = useRef<BlobPart[]>([]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.src = videoSrc;
        }
        localVideoSrc.current = videoSrc;
    }, [videoSrc]);
    

    const playVideoWithSubtitles = useCallback(async (subtitles: Subtitle[], videoType:string) => {
        console.log('playVideoWithSubtitles');
        subtitles = preProcessSubtitles(
            subtitles);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        if (!localVideoSrc.current) return;
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const stream = canvas.captureStream(25); // Capture at 25 FPS
        console.log('videoSrcccc', videoSrc);
        // just get entire vide from videoRef.current
        let {bitrate, frameRate} = await getVideoProperties(localVideoSrc.current, videoType);
        console.log('bitrate', bitrate);
        console.log('frameRate', frameRate);
         recorderRef.current = new RecordRTC(stream, {
            type: 'video',
            mimeType: 'video/webm;codecs=h264',
            bitsPerSecond: bitrate as number, // Use the dynamically determined bitrate
            videoBitsPerSecond: bitrate  as number, // Use the same value for video bitrate
            frameRate: frameRate  as number, // Apply the frame rate
        });
        // recorderRef.current = new RecordRTC(stream, {
        //     type: 'video',
        //     mimeType: 'video/webm;codecs=h264', // Specify desired output format
        //     bitsPerSecond: 25000000,
        //     videoBitsPerSecond: 25000000,
        //     frameRate: 30,
        // });
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
                onRecordingComplete(processedBlob);

                //const url = URL.createObjectURL(processedBlob);



                // const url = URL.createObjectURL(blob);
                // const a = document.createElement('a');
                // a.href = url;
                // a.download = 'recordedVideoWithSubtitles.mp4';
                // document.body.appendChild(a);
                // a.click();
                // document.body.removeChild(a);
                // URL.revokeObjectURL(url);
            });
        };

        video.play();
        recorderRef.current.startRecording();
        //recorderRef.current.start();

        video.addEventListener('play', () => {
            console.log('subtitles' , subtitles);
            const drawFrame = createDrawFrame(video, canvas, subtitles, stopRecordingCallback);
            // const drawFrame = createDrawFrame(
            //     video, canvas, subtitles, stopRecordingCallback);
            //const drawFrame = createDrawFrame(video, canvas, subtitles, stopRecordingCallback, popInEffect);
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



