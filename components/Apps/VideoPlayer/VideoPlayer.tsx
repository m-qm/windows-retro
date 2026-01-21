'use client';

import React, { useRef, useState, useEffect } from 'react';

export const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Video source (compressed for web deployment)
  const videoSrc = '/videos/1_compressed.mp4';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration || 0);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Set initial volume
    video.volume = volume;

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
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
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
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

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        background: '#000000' 
      }}
    >
      {/* Video Display */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={handlePlayPause}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
          }}
          playsInline
        />
        
        {/* Play overlay when paused */}
        {!isPlaying && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '48px',
              color: 'rgba(255, 255, 255, 0.8)',
              pointerEvents: 'none',
            }}
          >
            ▶
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          padding: '8px',
          background: '#1a1a1a',
          borderTop: '1px solid #333333',
        }}
      >
        {/* Progress Bar */}
        <div style={{ marginBottom: '8px' }}>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="win-button" 
            onClick={handlePlayPause} 
            title={isPlaying ? 'Pause' : 'Play'}
            style={{ minWidth: '32px' }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <button 
            className="win-button" 
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                video.currentTime = 0;
              }
            }}
            title="Stop"
            style={{ minWidth: '32px' }}
          >
            ⏹
          </button>

          {/* Time Display */}
          <span style={{ fontSize: '11px', color: '#cccccc', minWidth: '80px' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div style={{ flex: 1 }} />

          {/* Volume Controls */}
          <button 
            className="win-button" 
            onClick={toggleMute} 
            title={isMuted ? 'Unmute' : 'Mute'}
            style={{ minWidth: '32px' }}
          >
            {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            style={{ width: '60px', cursor: 'pointer' }}
            title={`Volume: ${Math.round(volume * 100)}%`}
          />

          <button 
            className="win-button" 
            onClick={handleFullscreen} 
            title="Fullscreen"
            style={{ minWidth: '32px' }}
          >
            ⛶
          </button>
        </div>

        {/* Video Info */}
        <div style={{ fontSize: '10px', color: '#888888', marginTop: '4px' }}>
          Now Playing: 1.mov
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
