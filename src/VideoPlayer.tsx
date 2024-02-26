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
    const [outputVideoSrc, setOutputVideoSrc] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null); // To store the transcript
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [decodedAudio, setDecodedAudio] = useState<AudioBuffer | null>(null);

    React.useEffect(() => {
        console.log("Loading ffmpeg");
        (async () => {
            await ffmpeg.load();
        })();
    }, []);
    
    
    const generateSubtitles = async () => {
        if (!video) return;
        props.transcriber.start(decodedAudio as AudioBuffer);
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
            props.setVideoSrc(url);
        }
    };

    const removeVideo = () => {
        // Remove the video and revoke the object URL to free up memory
        URL.revokeObjectURL(props.videoSrc);
        props.setVideoSrc(null);
    };
    
    
    return (
        <>
          <Row className="justify-content-center mt-5">
            <Col xs={12}>
              <div className="d-flex justify-content-center">
                {!props.videoSrc ? (
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
                      <video src={props.videoSrc} controls />
                    </div>
                )}
              </div>
            </Col>
          </Row>
          {(props.videoSrc && !props.transcriber.output) && (
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
