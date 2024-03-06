// subtitleWorker.js

/* eslint-disable-next-line no-restricted-globals */
self.addEventListener('message', (event) => {
    const { currentTime, subtitles } = event.data;
    const subtitle = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);
    /* eslint-disable-next-line no-restricted-globals */
    self.postMessage({ subtitle });
});
