import React, { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg'	;
import { fetchFile } from '@ffmpeg/util';
import Constants from "./utils/Constants";
import { useTranscriber } from "./hooks/useTranscriber";

// @ts-ignore
import audioBufferToWav from 'audiobuffer-to-wav';

import Whisper from './whisper';

const ffmpeg = new FFmpeg();
const whisper = new Whisper();


const VideoUploader: React.FC = () => {
    const [video, setVideo] = useState<File | null>(null);
    const [videoSrc, setVideoSrc] = useState<string | any>(null);
    const [outputVideoSrc, setOutputVideoSrc] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null); // To store the transcript
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [decodedAudio, setDecodedAudio] = useState<AudioBuffer | null>(null);
    const transcriber = useTranscriber();



    React.useEffect(() => {
        (async () => {
            await ffmpeg.load();
        })();
    }, []);
    
    const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.length) {
            const file = event.target.files[0];
            const urlObj = URL.createObjectURL(file);
            const mimeType = file.type;
            const reader = new FileReader();
            reader.addEventListener('load', async () => {
                const arrayBuffer = reader.result;
                if(!arrayBuffer) return;
                const audioContext = new AudioContext(
                    {sampleRate: Constants.SAMPLING_RATE});
                const decodedAudio = await audioContext.decodeAudioData(arrayBuffer as ArrayBuffer);
                //const audioBuffer = await audioContext.decodeAudioData(arrayBuffer as ArrayBuffer);
                const wav = audioBufferToWav(decodedAudio, { float32: false });
                const wavBlob = new Blob([wav], { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(wavBlob);
                setAudioSrc(audioUrl);
                setDecodedAudio(decodedAudio);
            });
            reader.readAsArrayBuffer(file);
            setVideo(file);
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
        }
    };
    
    const generateSubtitles = async () => {
        if (!video) return;
        transcriber.start(decodedAudio as AudioBuffer);
    };

    const burnSubtitlesIntoVideo = async () => {
        if (!video) return;

        if (!ffmpeg.loaded) await ffmpeg.load();

        const videoFilename = video.name;
        ffmpeg.writeFile(videoFilename, await fetchFile(videoSrc));

        // Assuming you have a subtitles file named 'subtitles.srt' in public folder
        // In a real application, you should upload this file or generate it dynamically
        const subtitlesFilename = 'subtitles.srt';
        const subtitlesFile = await fetch('/subtitles.srt');
        const subtitlesBlob = await subtitlesFile.blob();
        ffmpeg.writeFile(subtitlesFilename, await fetchFile(subtitlesBlob));

        // Command to burn subtitles into video
        await ffmpeg.exec(['-i', videoFilename, '-vf', `subtitles=${subtitlesFilename}`, 'output.mp4']);

        const data = await ffmpeg.readFile('output.mp4');
        const outputUrl = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
        setOutputVideoSrc(outputUrl);
    };

    return (
        <div>
          <input type="file" onChange={handleVideoUpload} accept="video/*" />
          {videoSrc && <video src={videoSrc} controls width="250" />}
          <div>
            <button onClick={generateSubtitles}>Generate Subtitles</button>
            <button onClick={burnSubtitlesIntoVideo} disabled={!videoSrc}>Burn Subtitles into Video</button>
          </div>
          {outputVideoSrc && <div>
            <h3>Processed Video:</h3>
            <video src={outputVideoSrc} controls width="250" />
          </div>}
          {transcript && <div>
            <h3>Transcript:</h3>
            <p>{transcript}</p>
          </div>}
          {audioSrc && <div>
            <h3>Extracted Audio:</h3>
            <audio src={audioSrc} controls />
          </div>}
        </div>
    );
};

export default VideoUploader;
