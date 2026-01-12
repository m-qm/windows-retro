'use client';

import React, { useRef, useState, useEffect } from 'react';

const SAMPLE_VIDEOS = [
  '/videos/1.mov',
];

export const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentVideo = SAMPLE_VIDEOS[currentIndex];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    video.src = currentVideo;
    video.load();
  }, [currentIndex, currentVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + SAMPLE_VIDEOS.length) % SAMPLE_VIDEOS.length);
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SAMPLE_VIDEOS.length);
    setIsPlaying(false);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if ((video as any).webkitRequestFullscreen) {
        (video as any).webkitRequestFullscreen();
      } else if ((video as any).mozRequestFullScreen) {
        (video as any).mozRequestFullScreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000' }}>
      {/* Video Display */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          position: 'relative',
        }}
      >
        {currentVideo ? (
          <video
            ref={videoRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
            }}
            controls={false}
          />
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
            <div>Sample Video {currentIndex + 1}</div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#cccccc' }}>
              Place videos in /public/videos/
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        <button
          className="win-button"
          onClick={handlePrevious}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '20px',
            padding: '8px 12px',
            zIndex: 10,
          }}
          title="Previous"
        >
          ◀
        </button>
        <button
          className="win-button"
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '20px',
            padding: '8px 12px',
            zIndex: 10,
          }}
          title="Next"
        >
          ▶
        </button>
      </div>

      {/* Controls */}
      <div
        style={{
          padding: '8px',
          background: '#1a1a1a',
          borderTop: '1px solid #000000',
        }}
      >
        {/* Seek Bar */}
        <div style={{ marginBottom: '8px' }}>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            style={{ width: '100%' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              marginTop: '4px',
              color: '#888888',
            }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="win-button" onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="win-button" onClick={handleStop} title="Stop">
            ⏹
          </button>
          <button className="win-button" onClick={handlePrevious} title="Previous">
            ⏮
          </button>
          <button className="win-button" onClick={handleNext} title="Next">
            ⏭
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="win-button"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            style={{ width: '100px' }}
          />
          <span style={{ fontSize: '10px', color: '#888888', minWidth: '40px' }}>
            {Math.round(volume * 100)}%
          </span>
          <button className="win-button" onClick={handleFullscreen} title="Fullscreen">
            ⛶
          </button>
        </div>

        {/* Video Info */}
        <div style={{ fontSize: '10px', color: '#888888', marginTop: '4px' }}>
          Video {currentIndex + 1} of {SAMPLE_VIDEOS.length}
        </div>
      </div>
    </div>
  );
};

