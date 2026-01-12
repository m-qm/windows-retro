'use client';

import React from 'react';

interface WindowControlsProps {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  isMaximized?: boolean;
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  onMinimize,
  onMaximize,
  onClose,
  isMaximized = false,
}) => {
  return (
    <div className="flex items-center ml-auto gap-1">
      {onMinimize && (
        <button
          className="win-control"
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          title="Minimize"
        >
          <span style={{ fontSize: '10px', lineHeight: '1' }}>_</span>
        </button>
      )}
      {onMaximize && (
        <button
          className="win-control"
          onClick={(e) => {
            e.stopPropagation();
            onMaximize();
          }}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <span style={{ fontSize: '8px', lineHeight: '1' }}>□</span>
        </button>
      )}
      {onClose && (
        <button
          className="win-control win-control-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close"
        >
          <span style={{ fontSize: '10px', lineHeight: '1' }}>×</span>
        </button>
      )}
    </div>
  );
};

