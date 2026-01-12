'use client';

import React, { useState, useEffect } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { StartMenu } from './StartMenu';
import { Icon } from '@/components/Icons/IconMapper';

export const Taskbar: React.FC = () => {
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const windows = useWindowStore((state) => state.windows);
  const activeWindowId = useWindowStore((state) => state.activeWindowId);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const restoreWindow = useWindowStore((state) => state.restoreWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const handleTaskButtonClick = (windowId: string, isMinimized: boolean) => {
    if (isMinimized) {
      restoreWindow(windowId);
      focusWindow(windowId);
    } else {
      minimizeWindow(windowId);
    }
  };

  const visibleWindows = windows.filter((w) => !w.isMinimized || true); // Show all windows in taskbar

  return (
    <div className="win-taskbar">
      <button
        className={`win-start-button ${showStartMenu ? 'active' : ''}`}
        onClick={() => setShowStartMenu(!showStartMenu)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 12px' }}
      >
        <img
          src="/icons/windows.png"
          alt="Windows Logo"
          style={{ width: '18px', height: '18px', display: 'block' }}
        />
        Start
      </button>
      {showStartMenu && <StartMenu onClose={() => setShowStartMenu(false)} />}

      {/* Window Task Buttons */}
      <div style={{ display: 'flex', gap: '2px', flex: 1, marginLeft: '4px', overflowX: 'auto' }}>
        {windows.map((window) => {
          const isActive = activeWindowId === window.id;
          return (
            <button
              key={window.id}
              className="win-button"
              style={{
                minWidth: '120px',
                textAlign: 'left',
                padding: '2px 8px',
                backgroundColor: isActive ? '#c0c0c0' : '#c0c0c0',
                border: isActive ? '2px inset #c0c0c0' : '2px outset #c0c0c0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onClick={() => handleTaskButtonClick(window.id, window.isMinimized)}
              title={window.title}
            >
              {window.icon && (
                <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', verticalAlign: 'middle' }}>
                  <Icon name={window.icon} size={16} />
                </span>
              )}
              {window.title}
            </button>
          );
        })}
      </div>

      {/* System Tray */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          borderLeft: '1px solid #808080',
          borderRight: '1px solid #ffffff',
          height: '100%',
          minWidth: '80px',
          justifyContent: 'center',
          fontSize: '11px',
        }}
      >
        {formatTime(currentTime)}
      </div>
    </div>
  );
};

