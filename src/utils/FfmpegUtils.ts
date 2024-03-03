// ffmpegUtils.ts

import { FFmpeg } from '@ffmpeg/ffmpeg'	;

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

export default FFmpegUtil;
