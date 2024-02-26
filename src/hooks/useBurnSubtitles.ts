import { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg'	;
import { fetchFile } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

const useBurnSubtitles = (videoSrc:any) => {
    const [outputVideoSrc, setOutputVideoSrc] = useState(null as any);

    const processTranscriptToASS = (transcriptData:any) => {
        let assContent = `
[Script Info]
Title: Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,24,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

        transcriptData.forEach(({ text, timestamp }:any) => {
            const startTime = formatTimestampToASS(timestamp[0]);
            const endTime = formatTimestampToASS(timestamp[1]);
            const words = text.split(' ');
            let currentTime = timestamp[0];

            words.forEach((word:any, index:any) => {
                const wordEndTime = currentTime + ((timestamp[1] - timestamp[0]) / words.length);
                assContent += `Dialogue: 0,${formatTimestampToASS(currentTime)},${formatTimestampToASS(wordEndTime)},Default,,0,0,0,,${word}\\N`;
                currentTime = wordEndTime;
            });
        });
        console.log(assContent);
        return assContent;
    };

    const formatTimestampToASS = (seconds:any) => {
        const hour = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const minute = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const second = Math.floor(seconds % 60).toString().padStart(2, '0');
        const cs = ((seconds % 1) * 100).toFixed(0).padStart(2, '0');
        
        return `${hour}:${minute}:${second}.${cs}`;
    };


    const burnSubtitlesIntoVideo = async (transcript:any) => {
        if (!videoSrc) return;
        if (!ffmpeg.loaded) await ffmpeg.load();

        const videoFilename = 'input.mp4';
        await ffmpeg.writeFile(videoFilename, await fetchFile(videoSrc));

        const subtitlesContent = processTranscriptToASS(transcript);
        const subtitlesFilename = 'subtitles.ass';
        await ffmpeg.writeFile(subtitlesFilename, subtitlesContent);
        console.log("lfg");
        await ffmpeg.exec(['-i', videoFilename, '-vf', `subtitles=${subtitlesFilename}`, 'output.mp4']);
        console.log("lfg1.2")
        const data = await ffmpeg.readFile('output.mp4');
        console.log("lfg2")
        const outputUrl = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
        console.log(outputUrl);
        setOutputVideoSrc(outputUrl);
    };

    return { outputVideoSrc, burnSubtitlesIntoVideo };
};

export default useBurnSubtitles;
