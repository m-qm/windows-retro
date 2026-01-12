'use client';

import React from 'react';
import { WindowControls } from './WindowControls';
import { Icon } from '@/components/Icons/IconMapper';

interface TitleBarProps {
  title: string;
  icon?: string;
  isActive: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  isMaximized?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title,
  icon,
  isActive,
  onMinimize,
  onMaximize,
  onClose,
  isMaximized = false,
  onMouseDown,
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't drag if clicking on window controls
    const target = e.target as HTMLElement;
    if (target.closest('.win-control')) {
      return;
    }
    if (onMouseDown) {
      onMouseDown(e);
    }
  };

  return (
    <div className={`win-titlebar ${!isActive ? 'inactive' : ''}`} onMouseDown={handleMouseDown}>
      {icon && (
        <div style={{ width: '16px', height: '16px', marginRight: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={16} />
        </div>
      )}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
      </span>
      <WindowControls
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        onClose={onClose}
        isMaximized={isMaximized}
      />
    </div>
  );
};

