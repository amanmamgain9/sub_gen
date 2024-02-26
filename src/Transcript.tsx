import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

import { TranscriberData } from "./hooks/useTranscriber";
import { formatAudioTimestamp } from "./utils/AudioUtils";
import useBurnSubtitles  from "./hooks/useBurnSubtitles";
import useVideoSubtitlesRecorder from "./hooks/useVideoSubtitlesRecorder";

interface Props {
    transcribedOutput: TranscriberData | any ;
    videoSrc: string;
}

export default function Transcript({transcribedOutput, videoSrc }: Props) {
    const divRef = useRef<HTMLDivElement>(null);
    const [editText, setEditText] = useState("");
    const { outputVideoSrc, burnSubtitlesIntoVideo } = useBurnSubtitles(videoSrc);
    
    const [editIndex, setEditIndex] = useState(null);
    const [transcribedData, setTranscribedData] = useState<TranscriberData | any>(transcribedOutput);
    const inputRef = useRef(null as any);
    const { videoRef, canvasRef, playVideoWithSubtitles } = useVideoSubtitlesRecorder(videoSrc);


    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [editIndex]);

    useEffect(() => {
        console.log('Transcribed Output:', transcribedOutput);
        setTranscribedData(transcribedOutput);
    }, [transcribedOutput]);
    
    const saveText = (index:number) => {
        const updatedChunks = [...transcribedData.chunks];
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
    
    const exportTXT = () => {
        let chunks = transcribedData?.chunks ?? [];
        let text = chunks
            .map((chunk:any) => chunk.text)
            .join("")
            .trim();

        const blob = new Blob([text], { type: "text/plain" });
        saveBlob(blob, "transcript.txt");
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
        console.log('Burning the text to the video...');
        console.log('Transcribed Data:', transcribedData.chunks);
        //await burnSubtitlesIntoVideo(transcribedData.chunks);
        await playVideoWithSubtitles(transcribedData.chunks);
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
        {transcribedData?.chunks && transcribedData.chunks.length > 0 && (
            <Button variant="primary" onClick={handleBurnToVideo} className="my-2">
              Burn to Video
            </Button>
        )}
        {(true) && (
            <div className="my-2">
              <canvas ref={canvasRef} ></canvas>
              <video ref={videoRef}  controls width="640" height="360"></video>
            </div>
        )}
        </>

    );
}
