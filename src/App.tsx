import React from 'react';
import logo from './logo.svg';
import './App.css';
import VideoUploader from './VideoPlayer';
import Transcript from './Transcript';
import { Container, Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import { BsUpload } from 'react-icons/bs';
import { MdRecordVoiceOver } from 'react-icons/md';
import { useTranscriber } from "./hooks/useTranscriber";

function App(){

    const transcriber = useTranscriber();
    
    return (
        <div className="App">
          <header className="App-header">
            <h1 className="display-1">Yazzy Captioner</h1>
            <h2 style={{marginTop:"2em"}}>
              Upload a video to caption</h2>
          </header>
          <Container>
            <VideoUploader transcriber={transcriber} />
            <Transcript transcribedData={transcriber.output} />
          </Container>
        </div>
    );
}

export default App;
