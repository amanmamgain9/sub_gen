import React from 'react';
import logo from './logo.svg';
import './App.css';
import VideoUploader from './VideoPlayer';

function App() {

    
    return (
        <div className="App">
          <header className="App-header">
            <p>
              Upload a video to process with ffmpeg.wasm
            </p>
            <VideoUploader />
          </header>
        </div>
    );
}

export default App;
