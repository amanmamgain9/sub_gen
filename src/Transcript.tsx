import React, { useState, useRef, useEffect } from 'react';
import ProcessingModal from './ProcessingModal';
import { Container, Row, Col, Card, Button } from 'react-bootstrap'

import { TranscriberData } from "./hooks/useTranscriber";
import { formatAudioTimestamp } from "./utils/AudioUtils";
import useBurnSubtitles  from "./hooks/useBurnSubtitles";
import useVideoSubtitlesRecorder from "./hooks/useVideoSubtitlesRecorder"
//import useVideoSubtitlesDrawer from "./hooks/useVideoSubtitlesDrawer";

interface Props {
    transcribedOutput: TranscriberData | any ;
    videoSrc: string;
    videoType: string;
}

export default function Transcript({transcribedOutput, videoSrc, videoType }: Props) {
    const divRef = useRef<HTMLDivElement>(null);
    const [editText, setEditText] = useState("");
    const { outputVideoSrc, burnSubtitlesIntoVideo } = useBurnSubtitles(videoSrc);
    
    const [editIndex, setEditIndex] = useState(null);
    const [transcribedData, setTranscribedData] = useState<TranscriberData | any>(transcribedOutput);
    const inputRef = useRef(null as any);
    const [showModal, setShowModal] = useState(false);
    const [progress, setProgress] = useState(0);

    
    const stopRecordingCallback = async (processedBlob:any) => {
        // Your existing code to process the video...
        // Once you have the processedBlob ready:
        const url = URL.createObjectURL(processedBlob);
        setDownloadUrl(url); // Update the state with the new URL
    };

    
    //const { videoRef, canvasRef, playVideoWithSubtitles } = useVideoSubtitlesRecorder(videoSrc, stopRecordingCallback);
    const { videoRef, canvasRef, playVideoWithSubtitles } = useVideoSubtitlesRecorder(videoSrc, stopRecordingCallback, videoType);
    const [isBurning, setIsBurning] = useState(false); 
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [editIndex]);

    useEffect(() => {
        setTranscribedData(transcribedOutput);
    }, [transcribedOutput]);
    
    const saveText = (index:number) => {
        const updatedChunks:any = [...transcribedData.chunks];
        updatedChunks[index].text = editText;
        setTranscribedData({ ...transcribedData, chunks: updatedChunks });
        setEditIndex(null);
    };
    
    const handleTextChange = (e:any) => {
        setEditText(e.target.value);
    };
    
    const saveBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };
        
    useEffect(() => {
        if (divRef.current) {
            const diff = Math.abs(
                divRef.current.offsetHeight +
                divRef.current.scrollTop -
                divRef.current.scrollHeight,
            );

            if (diff <= 64) {
                // We're close enough to the bottom, so scroll to the bottom
                divRef.current.scrollTop = divRef.current.scrollHeight;
            }
        }
    });

    const handleTextClick = (index:any, text:any) => {
        setEditIndex(index);
        setEditText(text);
    };

    const handleBurnToVideo = async () => {
        // Logic to burn text to video
        //await burnSubtitlesIntoVideo(transcribedData.chunks);
        setIsBurning(true);
        setShowModal(true);
        await playVideoWithSubtitles(transcribedData.chunks, videoType);
        //setIsBurning(false);
        // You would replace this with your actual burning logic
    };
    
    return (
        <>
          <Container ref={divRef} style={{ maxHeight: '20rem', overflowY: 'auto' }} className="my-2 p-4">
            {transcribedData?.chunks &&
             transcribedData.chunks.map((chunk:any, i:number) => (
                 <Row key={`${i}-${chunk.text}`} className="mb-2">
                   <Col>
                     <Card>
                       <Card.Body className="d-flex">
                         <div className="flex-grow-1" style={{ marginRight: '1rem' }}>
                           <span style={{ fontWeight: 'bold' }}>{formatAudioTimestamp(chunk.timestamp[0])}</span>
                         </div>
                         {editIndex === i ? (
                             <input
                                 ref={inputRef}
                                 value={editText}
                                 onChange={handleTextChange}
                                 onBlur={() => saveText(i)}
                                 onKeyPress={(e) => e.key === 'Enter' && saveText(i)}
                                 className="form-control"
                             />
                         ) : (
                             <div onClick={() => handleTextClick(i, chunk.text)} style={{ textAlign: 'left', flexGrow: 2 }}>
                               {chunk.text}
                             </div>
                         )}
                       </Card.Body>
                     </Card>
                   </Col>
                 </Row>
            ))}
          </Container>
          <div className="d-flex justify-content-center"> {/* Center the button */}

            {(transcribedData?.chunks && transcribedData.chunks.length > 0 && !isBurning) && (
                <div>
                  <Button variant="primary" onClick={handleBurnToVideo} className="my-2 btn-lg">
                    Burn to Video
                  </Button>
                </div>
            )}
          </div>
          <div className="d-flex justify-content-center">
            {(true) && (
                <div className="my-2">
                  <canvas ref={canvasRef} ></canvas>
                  <video ref={videoRef}  controls width="640" height="360"></video>
                </div>
            )}
          </div>
          <div className="d-flex justify-content-center">
            {downloadUrl && (
                <a href={downloadUrl} download="recordedVideoWithSubtitles.mp4" style={{ textDecoration: 'none' }}>
                  <Button variant="success" className="my-2">
                    Download Video
                  </Button>
                </a>
            )}
          </div>
          <ProcessingModal
              show={showModal}
              progress={progress}
              setShowModal={setShowModal}
              downloadUrl={downloadUrl} />
        </>
    );
}
