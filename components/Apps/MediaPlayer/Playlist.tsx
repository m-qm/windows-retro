'use client';

import React from 'react';
import { Icon } from '@/components/Icons/IconMapper';

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
}

export const Playlist: React.FC<PlaylistProps> = ({
  tracks,
  currentTrackIndex,
  onTrackSelect,
}) => {
  // Playlist is always visible - no collapsed state
  return (
    <div
      style={{
        width: '200px',
        minWidth: '200px',
        flex: 1,
        minHeight: 0,
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
        }}
      >
        <div
          style={{
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Icon name="media-player" size={12} />
          <span>All music</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', color: '#ffffff' }}>
        {tracks.map((track, index) => (
          <div
            key={track.id}
            onClick={() => onTrackSelect(index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              minHeight: '44px',
              padding: '0 10px',
              cursor: 'pointer',
              backgroundColor: index === currentTrackIndex ? '#000080' : 'transparent',
              color: index === currentTrackIndex ? '#ffffff' : '#b0b0b0',
              fontSize: '12px',
              borderLeft: index === currentTrackIndex ? '3px solid #ffcc00' : '3px solid transparent',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (index !== currentTrackIndex) {
                e.currentTarget.style.backgroundColor = '#3a3a3a';
                e.currentTarget.style.color = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (index !== currentTrackIndex) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#b0b0b0';
              }
            }}
          >
            <span
              style={{
                fontWeight: index === currentTrackIndex ? 600 : 400,
                letterSpacing: '0.02em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {track.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

