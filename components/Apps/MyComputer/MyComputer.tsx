'use client';

import React, { useState } from 'react';

interface Drive {
  id: string;
  name: string;
  type: 'hard-disk' | 'cd-rom' | 'floppy';
  icon: string;
}

const DRIVES: Drive[] = [
  { id: 'c', name: 'Local Disk (C:)', type: 'hard-disk', icon: '💾' },
  { id: 'd', name: 'Local Disk (D:)', type: 'hard-disk', icon: '💾' },
  { id: 'e', name: 'CD-ROM (E:)', type: 'cd-rom', icon: '💿' },
];

export const MyComputer: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'icons'>('icons');
  const [selectedDrive, setSelectedDrive] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#c0c0c0' }}>
      {/* Toolbar */}
      <div className="win-toolbar">
        <button
          className="win-toolbar-button"
          onClick={() => setViewMode('icons')}
          style={{
            backgroundColor: viewMode === 'icons' ? '#000080' : '#c0c0c0',
            color: viewMode === 'icons' ? '#ffffff' : '#000000',
          }}
        >
          Icons
        </button>
        <button
          className="win-toolbar-button"
          onClick={() => setViewMode('list')}
          style={{
            backgroundColor: viewMode === 'list' ? '#000080' : '#c0c0c0',
            color: viewMode === 'list' ? '#ffffff' : '#000000',
          }}
        >
          List
        </button>
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          background: '#c0c0c0',
        }}
      >
        {viewMode === 'icons' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '16px',
            }}
          >
            {DRIVES.map((drive) => (
              <div
                key={drive.id}
                onClick={() => setSelectedDrive(drive.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedDrive === drive.id ? '#000080' : 'transparent',
                  color: selectedDrive === drive.id ? '#ffffff' : '#000000',
                  border: selectedDrive === drive.id ? '2px dashed #ffffff' : '2px solid transparent',
                }}
                onDoubleClick={() => {
                  alert(`Opening ${drive.name}...`);
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>{drive.icon}</div>
                <div
                  style={{
                    fontSize: '11px',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    maxWidth: '100px',
                  }}
                >
                  {drive.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {DRIVES.map((drive) => (
              <div
                key={drive.id}
                onClick={() => setSelectedDrive(drive.id)}
                onDoubleClick={() => {
                  alert(`Opening ${drive.name}...`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  backgroundColor: selectedDrive === drive.id ? '#000080' : 'transparent',
                  color: selectedDrive === drive.id ? '#ffffff' : '#000000',
                }}
              >
                <span style={{ fontSize: '24px', marginRight: '8px' }}>{drive.icon}</span>
                <span style={{ fontSize: '11px' }}>{drive.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="win-statusbar">
        <span>{DRIVES.length} object(s)</span>
      </div>
    </div>
  );
};

