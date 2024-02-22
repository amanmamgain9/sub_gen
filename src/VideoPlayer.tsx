import React, { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg'	;
import { fetchFile } from '@ffmpeg/util';
import Constants from "./utils/Constants";

import { Container, Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import { MdRecordVoiceOver } from 'react-icons/md';

import { BsUpload, BsX } from 'react-icons/bs';

// @ts-ignore
import audioBufferToWav from 'audiobuffer-to-wav';

import Whisper from './whisper';

const ffmpeg = new FFmpeg();
const whisper = new Whisper();


const VideoUploader: React.FC<any> = (props:any) => {
    const [video, setVideo] = useState<File | null>(null);
    const [videoSrc, setVideoSrc] = useState<string | any>(null);
    const [outputVideoSrc, setOutputVideoSrc] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null); // To store the transcript
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [decodedAudio, setDecodedAudio] = useState<AudioBuffer | null>(null);

    React.useEffect(() => {
        (async () => {
            await ffmpeg.load();
        })();
    }, []);
    
    
    const generateSubtitles = async () => {
        if (!video) return;
        props.transcriber.start(decodedAudio as AudioBuffer);
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

    const removeVideo = () => {
        // Remove the video and revoke the object URL to free up memory
        URL.revokeObjectURL(videoSrc);
        setVideoSrc(null);
    };
    
    
    return (
        <>
          <Row className="justify-content-center mt-5">
            <Col xs={12}>
              <div className="d-flex justify-content-center">
                {!videoSrc ? (
                    <ButtonGroup aria-label="File upload options">
                      <label className="btn btn-primary">
                        <BsUpload /> Select Video file
                        <input
                            type="file"
                            hidden
                            onChange={handleVideoUpload}
                            accept="video/*"
                        />
                      </label>
                    </ButtonGroup>
                ) : (
                    <div className="video-container">
                      <div className="remove-video-btn" onClick={removeVideo}>
                        <BsX />
                      </div>
                      <video src={videoSrc} controls />
                    </div>
                )}
              </div>
            </Col>
          </Row>
          {videoSrc && (
              <Row className="justify-content-center mt-3">
                <Col xs={12} className="d-flex justify-content-center">
                  <Button variant="primary" onClick={generateSubtitles}>
                    Caption It!
                  </Button>
                </Col>
              </Row>
          )}
        </>
    );

};

export default VideoUploader;
