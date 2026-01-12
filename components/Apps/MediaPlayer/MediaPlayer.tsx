'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { Visualizer } from './Visualizer';
import { Controls } from './Controls';
import { Playlist } from './Playlist';
import { VisualizerMode } from '@/hooks/useAudioVisualizer';

export const MediaPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaylistCollapsed, setIsPlaylistCollapsed] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('battery');
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);

  const mediaPlayerState = useWindowStore((state) => state.mediaPlayerState);
  const {
    togglePlay,
    setCurrentTrack,
    nextTrack,
    previousTrack,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    toggleMute,
  } = useWindowStore();

  const { currentTrack, isPlaying, volume, isMuted, isShuffled, isRepeating, playlist } = mediaPlayerState;
  const currentTrackData = playlist[currentTrack];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      if (isRepeating) {
        audio.currentTime = 0;
        audio.play();
      } else {
        useWindowStore.getState().nextTrack();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isRepeating]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrackData) return;

    audio.src = currentTrackData.url;
    if (isPlaying) {
      audio.play().catch(console.error);
    }
  }, [currentTrack, currentTrackData, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)',
        color: '#ffffff',
      }}
    >
      {/* Now Playing Section */}
      <div
        style={{
          padding: '12px',
          background: '#1a1a1a',
          borderBottom: '1px solid #000000',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          {currentTrackData?.title || 'No track selected'}
        </div>
        <div style={{ fontSize: '10px', color: '#888888' }}>
          {currentTrackData?.artist || 'Unknown Artist'}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Visualizer and Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Visualizer */}
          <div style={{ flex: 1, minHeight: '150px', background: '#000000' }}>
            <div style={{ padding: '4px', background: '#1a1a1a', borderBottom: '1px solid #000000', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#cccccc' }}>Mode:</span>
                <select
                  className="win-input"
                  value={visualizerMode}
                  onChange={(e) => setVisualizerMode(e.target.value as VisualizerMode)}
                  style={{ fontSize: '10px', padding: '2px', minWidth: '110px' }}
                >
                  <option value="battery">Battery (Classic)</option>
                  <option value="bars">Spectrum Bars</option>
                  <option value="waveform">Waveform</option>
                  <option value="scope">Scope</option>
                </select>
              </div>
              <button
                className="win-button"
                onClick={() => setVisualizerEnabled(!visualizerEnabled)}
                style={{ fontSize: '10px', padding: '2px 6px' }}
              >
                {visualizerEnabled ? 'Hide' : 'Show'}
              </button>
            </div>
            {visualizerEnabled && (
              <div style={{ height: 'calc(100% - 30px)', width: '100%' }}>
                <Visualizer
                  audioElement={audioRef.current}
                  enabled={visualizerEnabled && isPlaying}
                  mode={visualizerMode}
                  width={400}
                  height={150}
                />
              </div>
            )}
          </div>

          {/* Seek Bar */}
          <div style={{ padding: '8px', background: '#1a1a1a' }}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px', color: '#888888' }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <Controls
            isPlaying={isPlaying}
            onPlay={() => togglePlay()}
            onPause={() => togglePlay()}
            onStop={() => {
              togglePlay();
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
              }
            }}
            onPrevious={previousTrack}
            onNext={nextTrack}
            onShuffle={toggleShuffle}
            onRepeat={toggleRepeat}
            isShuffled={isShuffled}
            isRepeating={isRepeating}
          />

          {/* Volume Control */}
          <div style={{ padding: '8px', background: '#1a1a1a', borderTop: '1px solid #000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="win-button"
              onClick={toggleMute}
              style={{ fontSize: '12px', padding: '2px 6px' }}
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
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '10px', minWidth: '40px', textAlign: 'right' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* Playlist */}
        <Playlist
          tracks={playlist}
          currentTrackIndex={currentTrack}
          onTrackSelect={(index) => {
            setCurrentTrack(index);
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
            }
          }}
          isCollapsed={isPlaylistCollapsed}
          onToggleCollapse={() => setIsPlaylistCollapsed(!isPlaylistCollapsed)}
        />
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="auto" />
    </div>
  );
};

