// ffmpegUtils.ts

import { FFmpeg } from '@ffmpeg/ffmpeg'	;

type ExtensionMap = {
    [key: string]: string;
};

// Create the extension map with MIME types as keys and file extensions as values
const extensionMap: ExtensionMap = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    // Add other MIME types and their corresponding extensions as needed
};

class FFmpegUtil {
    private static instance: FFmpeg | null = null;

    static async getFFmpegInstance() {
        if (!FFmpegUtil.instance) {
            const ffmpeg = new FFmpeg();
            await ffmpeg.load();
            FFmpegUtil.instance = ffmpeg;
            ffmpeg.on('log', ({ message }) => {
                console.log('message me baby', message);
            });
        }
        return FFmpegUtil.instance;
    }
}

function generateFileNameFromMimeType(mimeType: string) {
    // Basic mapping of MIME types to file extensions

    // Default extension if MIME type is unknown
    const defaultExtension = 'mp4';

    // Extract the file extension based on the MIME type
    const extension = extensionMap[mimeType] || defaultExtension;

    // Generate a file name using a timestamp or another method to ensure uniqueness
    const fileName = `inputVideo.${extension}`;

    return fileName;
}


export async function getVideoProperties(
    videoSrc: string, fileType: string){
    // Step 1: Load the video file into FFmpeg's virtual filesystem (if needed)
    // This might involve fetching the video file, converting it to a Uint8Array, and writing it to FFmpeg's FS.
    // Example (pseudo-code):
    //copy string not just reference
    let copyOfVideoSrc = videoSrc.slice();
    let fileName = generateFileNameFromMimeType(fileType);
    const response = await fetch(videoSrc);
    console.log('response', response);
    const videoBuffer = await response.arrayBuffer();
    const videoUint8Array = new Uint8Array(videoBuffer);
    let ffmpeg = await FFmpegUtil.getFFmpegInstance();
    console.log('videoUint8Array', videoUint8Array);
    // get file type from the videoSrc
    console.log('videoSrc', videoSrc);
    console.log('copyOfVideoSrc', copyOfVideoSrc);
    //ffmpeg.writeFile('inputVideo.mp4', videoUint8Array);
    ffmpeg.writeFile(fileName, videoUint8Array);
    console.log('fileType', fileType);
    // Step 2: Run an FFmpeg command to get video properties
    // This command prints codec, resolution, and framerate details

    //await ffmpeg.exec(['-i', 'inputVideo.mp4', '-hide_banner']);
    console.log('executednot');
    let ffmpegOutput = '';

    // Setup FFmpeg output callback
    ffmpeg.on('log',({ message }) => {
        ffmpegOutput += message + '\n'; // Concatenate output messages
    });
    await ffmpeg.exec(['-i', fileName, '-hide_banner']);
    console.log('executedddddd');
    const frameRateMatch = ffmpegOutput.match(/(\d+(\.\d+)?) fps/); // Simplified regex, adjust as needed
    const bitrateMatch = ffmpegOutput.match(/bitrate: (\d+) kb\/s/); // Simplified regex, adjust as needed

    const frameRate = frameRateMatch ? parseFloat(frameRateMatch[1]) : null;
    const bitrate = bitrateMatch ? parseInt(bitrateMatch[1], 10) * 1000 : null; // Convert kbps to bps

    return { frameRate, bitrate };
}

export default FFmpegUtil;

