'use client';

import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRefresh?: () => void;
  onNewFolder?: () => void;
  onProperties?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onRefresh,
  onNewFolder,
  onProperties,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleItemClick = (callback?: () => void) => {
    if (callback) {
      callback();
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="win-context-menu"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {onRefresh && (
        <div
          className="win-context-menu-item"
          onClick={() => handleItemClick(onRefresh)}
        >
          Refresh
        </div>
      )}
      {onNewFolder && (
        <div
          className="win-context-menu-item"
          onClick={() => handleItemClick(onNewFolder)}
        >
          New Folder
        </div>
      )}
      <div className="win-context-menu-separator" />
      {onProperties && (
        <div
          className="win-context-menu-item"
          onClick={() => handleItemClick(onProperties)}
        >
          Properties
        </div>
      )}
    </div>
  );
};

