'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWindowStore } from '@/stores/windowStore';

interface StartMenuProps {
  onClose: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onClose }) => {
  const [showPrograms, setShowPrograms] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const programsRef = useRef<HTMLDivElement>(null);
  const openWindow = useWindowStore((state) => state.openWindow);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        programsRef.current &&
        !programsRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleProgramClick = (windowType: string, title: string) => {
    openWindow(windowType as any, title);
    onClose();
  };

  return (
    <>
      <div ref={menuRef} className="win-start-menu">
        <div
          className="win-start-menu-item"
          style={{ fontWeight: 'bold', backgroundColor: '#000080', color: '#ffffff' }}
        >
          Windows 98
        </div>
        <div className="win-start-menu-separator" style={{ height: '1px', background: '#808080', margin: '2px 0', borderTop: '1px solid #ffffff' }} />
        <div
          className="win-start-menu-item has-arrow"
          onMouseEnter={() => setShowPrograms(true)}
          onClick={() => setShowPrograms(!showPrograms)}
        >
          Programs
        </div>
        <div
          className="win-start-menu-item"
          onClick={() => handleProgramClick('notepad', 'Notepad')}
        >
          Notepad
        </div>
        <div
          className="win-start-menu-item"
          onClick={() => handleProgramClick('media-player', 'Windows Media Player')}
        >
          Windows Media Player
        </div>
        <div className="win-start-menu-separator" style={{ height: '1px', background: '#808080', margin: '2px 0', borderTop: '1px solid #ffffff' }} />
        <div
          className="win-start-menu-item"
          onClick={() => handleProgramClick('my-computer', 'My Computer')}
        >
          My Computer
        </div>
        <div
          className="win-start-menu-item"
          onClick={() => handleProgramClick('internet-explorer', 'Internet Explorer')}
        >
          Internet Explorer
        </div>
        <div className="win-start-menu-separator" style={{ height: '1px', background: '#808080', margin: '2px 0', borderTop: '1px solid #ffffff' }} />
        <div
          className="win-start-menu-item"
          onClick={onClose}
        >
          Shut Down...
        </div>
      </div>
      {showPrograms && (
        <div
          ref={programsRef}
          className="win-start-menu"
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '204px',
            minWidth: '200px',
          }}
          onMouseLeave={() => setShowPrograms(false)}
        >
          <div
            className="win-start-menu-item"
            onClick={() => handleProgramClick('media-player', 'Windows Media Player')}
          >
            Windows Media Player
          </div>
          <div
            className="win-start-menu-item"
            onClick={() => handleProgramClick('photo-viewer', 'My Pictures')}
          >
            My Pictures
          </div>
          <div
            className="win-start-menu-item"
            onClick={() => handleProgramClick('video-player', 'My Videos')}
          >
            My Videos
          </div>
          <div className="win-start-menu-separator" style={{ height: '1px', background: '#808080', margin: '2px 0', borderTop: '1px solid #ffffff' }} />
          <div
            className="win-start-menu-item"
            onClick={() => handleProgramClick('notepad', 'Notepad')}
          >
            Notepad
          </div>
        </div>
      )}
    </>
  );
};

