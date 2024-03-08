import React, { useState, useEffect } from 'react';
import { Modal, Button, ProgressBar } from 'react-bootstrap';

const ProcessingModal = ({ show, progress, downloadUrl }:any) => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        let dotCount = 0;
        const interval = setInterval(() => {
            dotCount = (dotCount + 1) % 4; // Cycle through 0 to 3
            setDots('.'.repeat(dotCount)); // Set the number of dots
        }, 500); // Adjust the speed of dot animation as needed

        return () => clearInterval(interval); // Clean up on component unmount
    }, []);

    return (
        <Modal show={show} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Processing Video
            </Modal.Title>

          </Modal.Header>
          <Modal.Body className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            {(!downloadUrl) && (
                <>
                <div style={{ marginBottom: '20px', fontSize: '1.5rem', display: 'flex', justifyContent: 'center' }}>

                  <span>Processing</span>
                  <span style={{ display: 'inline-block', width: '30px', textAlign: 'left' }}>{dots}</span>
                </div>
                <ProgressBar now={progress} label={`${progress}%`} style={{ width: '100%', maxWidth: '500px', height: '20px', marginBottom: '20px' }} />
                </>
            )}
            {downloadUrl && (
                <a href={downloadUrl} download="recordedVideoWithSubtitles.mp4" style={{ textDecoration: 'none' }}>
                  <Button variant="success" className="mt-3">Download Video</Button>
                </a>
            )}
          </Modal.Body>
        </Modal>
    );
};

export default ProcessingModal;
