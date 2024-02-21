import React from 'react';
import logo from './logo.svg';
import './App.css';
import VideoUploader from './VideoPlayer';
import { Container, Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import { BsUpload } from 'react-icons/bs';
import { MdRecordVoiceOver } from 'react-icons/md';


function App(){
    return (
        <div className="App">
          <header className="App-header">
            <h1>Yazzy Captioner</h1>
            <p style={{marginTop:10, fontSize:20}}>Upload a video to caption</p>
            <VideoUploader />
          </header>
          <Container>
            <Row className="justify-content-md-center">
              <Col md="auto">
                <ButtonGroup aria-label="File upload options">
                  <Button variant="outline-primary">From URL</Button>
                  <Button variant="primary">
                    <BsUpload /> From file
                  </Button>
                  <Button variant="outline-primary">
                    <MdRecordVoiceOver /> Record
                  </Button>
                </ButtonGroup>
              </Col>
            </Row>
          </Container>
        </div>
    );
}

export default App;
