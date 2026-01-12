'use client';

import React from 'react';

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration?: number;
}

interface PlaylistProps {
  tracks: Track[];
  currentTrackIndex: number;
  onTrackSelect: (index: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
  tracks,
  currentTrackIndex,
  onTrackSelect,
  isCollapsed,
  onToggleCollapse,
}) => {
  if (isCollapsed) {
    return (
      <div
        style={{
          width: '20px',
          background: '#2a2a2a',
          borderLeft: '1px solid #000000',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onToggleCollapse}
      >
        ▶
      </div>
    );
  }

  return (
    <div
      style={{
        width: '200px',
        background: '#2a2a2a',
        borderLeft: '1px solid #000000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '4px',
          background: '#1a1a1a',
          borderBottom: '1px solid #000000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>Playlist</span>
        <button
          className="win-button"
          onClick={onToggleCollapse}
          style={{
            padding: '2px 4px',
            fontSize: '10px',
            minWidth: 'auto',
            height: '16px',
          }}
        >
          ◀
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', color: '#ffffff' }}>
        {tracks.map((track, index) => (
          <div
            key={track.id}
            onClick={() => onTrackSelect(index)}
            style={{
              padding: '4px 8px',
              cursor: 'pointer',
              backgroundColor: index === currentTrackIndex ? '#000080' : 'transparent',
              color: index === currentTrackIndex ? '#ffffff' : '#cccccc',
              fontSize: '11px',
            }}
            onMouseEnter={(e) => {
              if (index !== currentTrackIndex) {
                e.currentTarget.style.backgroundColor = '#404040';
              }
            }}
            onMouseLeave={(e) => {
              if (index !== currentTrackIndex) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={{ fontWeight: index === currentTrackIndex ? 'bold' : 'normal' }}>
              {track.title}
            </div>
            <div style={{ fontSize: '10px', color: '#888888' }}>{track.artist}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

