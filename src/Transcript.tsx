import { useRef, useEffect } from "react";
import { Container, Row, Col, Card } from 'react-bootstrap';

import { TranscriberData } from "./hooks/useTranscriber";
import { formatAudioTimestamp } from "./utils/AudioUtils";

interface Props {
    transcribedData: TranscriberData | undefined;
}

export default function Transcript({ transcribedData }: Props) {
    const divRef = useRef<HTMLDivElement>(null);

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
            .map((chunk) => chunk.text)
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

    return (
        <Container ref={divRef} style={{ maxHeight: '20rem', overflowY: 'auto' }} className="my-2 p-4">
          {transcribedData?.chunks &&
           transcribedData.chunks.map((chunk, i) => (
               <Row key={`${i}-${chunk.text}`} className="mb-2">
                 <Col>
                   <Card>
                     <Card.Body className="d-flex">
                       <div className="flex-grow-1" style={{ marginRight: '1rem' }}>
                         <span style={{ fontWeight: 'bold' }}>{formatAudioTimestamp(chunk.timestamp[0])}</span>
                       </div>
                       <div style={{ textAlign: 'left', flexGrow: 2 }}>
                         {chunk.text}
                       </div>
                     </Card.Body>
                   </Card>
                 </Col>
               </Row>
          ))}
        </Container>
    );
}
