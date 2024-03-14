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


const generateRandomFileName = (extension: string): string => {
    const randomString = Math.random().toString(36).substring(7);
    return `file_${randomString}.${extension}`;
};




export const extractAudio = async (videoSrc: string): Promise<string> => {
    const ffmpeg = await FFmpegUtil.getFFmpegInstance();
    const audioFileName = generateRandomFileName('aac');


    // Fetch the video data
    const response = await fetch(videoSrc);
    const videoData = await response.arrayBuffer();
    const videoUint8Array = new Uint8Array(videoData);

    // Write the video data to a temporary file
    await ffmpeg.writeFile('temp_video.mp4', videoUint8Array);

    await ffmpeg.exec([
        '-i', 'temp_video.mp4',
        '-vn', '-acodec', 'copy',
        audioFileName
    ]);

    return audioFileName;
};


export const addAudioToVideo = async (videoBlob: Blob, audioFileName: string): Promise<Blob> => {
    const ffmpeg = await FFmpegUtil.getFFmpegInstance();

    const buffer = await videoBlob.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    await ffmpeg.writeFile('input.webm', uint8Array);

    await ffmpeg.exec([
        '-i', 'input.webm',
        '-i', audioFileName,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-map', '0:v',
        '-map', '1:a',
        '-movflags', 'faststart',
        'output.mp4'
    ]);

    const processedUint8Array = await ffmpeg.readFile('output.mp4');
    const processedBlob = new Blob([processedUint8Array], { type: 'video/mp4' });

    return processedBlob;
};

export default FFmpegUtil;

