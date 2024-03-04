import React from 'react';
import { Modal, Button, ProgressBar } from 'react-bootstrap';

const ProcessingModal = ({ show, progress, downloadUrl }:any) => {
    return (
        <Modal show={show} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Processing Video
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h4>Video is being processed</h4>
                <ProgressBar now={progress} label={`${progress}%`} />
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
