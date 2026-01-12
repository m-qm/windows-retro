'use client';

import React from 'react';

interface ControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  isShuffled: boolean;
  isRepeating: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onPrevious,
  onNext,
  onShuffle,
  onRepeat,
  isShuffled,
  isRepeating,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px' }}>
      <button
        className="win-button"
        onClick={onShuffle}
        style={{
          backgroundColor: isShuffled ? '#000080' : '#c0c0c0',
          color: isShuffled ? '#ffffff' : '#000000',
        }}
        title="Shuffle"
      >
        ⇄
      </button>
      <button
        className="win-button"
        onClick={onPrevious}
        title="Previous"
      >
        ⏮
      </button>
      <button
        className="win-button"
        onClick={isPlaying ? onPause : onPlay}
        title={isPlaying ? 'Pause' : 'Play'}
        style={{ padding: '4px 12px', fontSize: '14px' }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button
        className="win-button"
        onClick={onStop}
        title="Stop"
      >
        ⏹
      </button>
      <button
        className="win-button"
        onClick={onNext}
        title="Next"
      >
        ⏭
      </button>
      <button
        className="win-button"
        onClick={onRepeat}
        style={{
          backgroundColor: isRepeating ? '#000080' : '#c0c0c0',
          color: isRepeating ? '#ffffff' : '#000000',
        }}
        title="Repeat"
      >
        🔁
      </button>
    </div>
  );
};

