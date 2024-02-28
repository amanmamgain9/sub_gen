const preProcessSubtitles = (subtitles:any, maxWordsPerSubtitle = 7) => {
    const newSubtitles:any = [];
    subtitles.forEach((subtitle:any) => {
        const words = subtitle.text.split(' ');
        if (words.length <= maxWordsPerSubtitle) {
            newSubtitles.push(subtitle);
        } else {
            const chunkDuration = (subtitle.timestamp[1] - subtitle.timestamp[0]) / Math.ceil(words.length / maxWordsPerSubtitle);
            for (let i = 0; i < words.length; i += maxWordsPerSubtitle) {
                const chunkWords = words.slice(i, i + maxWordsPerSubtitle);
                const startTime = subtitle.timestamp[0] + chunkDuration * (i / maxWordsPerSubtitle);
                const endTime = startTime + chunkDuration;
                newSubtitles.push({
                    text: chunkWords.join(' '),
                    timestamp: [startTime, Math.min(endTime, subtitle.timestamp[1])]
                });
            }
        }
    });
    return newSubtitles;
};
export { preProcessSubtitles };
