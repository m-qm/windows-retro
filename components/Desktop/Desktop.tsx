'use client';

import React, { useState, useRef } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { Window } from '../Window/Window';
import { DesktopIcon } from './DesktopIcon';
import { ContextMenu } from './ContextMenu';

// Import app components (will be created later)
const MediaPlayer = React.lazy(() => import('../Apps/MediaPlayer/MediaPlayer').then(m => ({ default: m.MediaPlayer })));
const PhotoViewer = React.lazy(() => import('../Apps/PhotoViewer/PhotoViewer').then(m => ({ default: m.PhotoViewer })));
const VideoPlayer = React.lazy(() => import('../Apps/VideoPlayer/VideoPlayer').then(m => ({ default: m.VideoPlayer })));
const Notepad = React.lazy(() => import('../Apps/Notepad/Notepad').then(m => ({ default: m.Notepad })));
const MyComputer = React.lazy(() => import('../Apps/MyComputer/MyComputer').then(m => ({ default: m.MyComputer })));
const InternetExplorer = React.lazy(() => import('../Apps/InternetExplorer/InternetExplorer').then(m => ({ default: m.InternetExplorer })));

const getWindowContent = (windowType: string, url?: string) => {
  switch (windowType) {
    case 'media-player':
      return <MediaPlayer />;
    case 'photo-viewer':
      return <PhotoViewer />;
    case 'video-player':
      return <VideoPlayer />;
    case 'notepad':
      return <Notepad />;
    case 'my-computer':
      return <MyComputer />;
    case 'internet-explorer':
      return <InternetExplorer url={url} />;
    default:
      return <div>Unknown application</div>;
  }
};

export const Desktop: React.FC = () => {
  const windows = useWindowStore((state) => state.windows);
  const desktopIcons = useWindowStore((state) => state.desktopIcons);
  const openWindow = useWindowStore((state) => state.openWindow);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  const handleIconDoubleClick = (iconId: string, windowType: string) => {
    const icon = desktopIcons.find((i) => i.id === iconId);
    if (icon) {
      openWindow(icon.windowType, icon.label, icon.icon);
    }
  };

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedIconId(null);
  };

  const handleDesktopClick = (e: React.MouseEvent) => {
    if (e.target === desktopRef.current || (e.target as HTMLElement).classList.contains('desktop-bg')) {
      setSelectedIconId(null);
      setContextMenu(null);
    }
  };

  return (
    <div
      ref={desktopRef}
      className="desktop-bg"
      onClick={handleDesktopClick}
      onContextMenu={handleDesktopContextMenu}
      style={{ position: 'relative', width: '100vw', height: 'calc(100vh - 30px)', overflow: 'hidden' }}
    >
      {/* Desktop Icons */}
      {desktopIcons.map((icon) => (
        <DesktopIcon
          key={icon.id}
          icon={icon}
          isSelected={selectedIconId === icon.id}
          onSelect={() => setSelectedIconId(icon.id)}
          onDoubleClick={() => handleIconDoubleClick(icon.id, icon.windowType)}
        />
      ))}

      {/* Windows */}
      {windows.map((window) => (
        <Window key={window.id} window={window}>
          <React.Suspense fallback={<div>Loading...</div>}>
            {getWindowContent(window.type, window.url)}
          </React.Suspense>
        </Window>
      ))}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRefresh={() => {
            console.log('Refresh desktop');
            setContextMenu(null);
          }}
          onNewFolder={() => {
            console.log('New folder');
            setContextMenu(null);
          }}
          onProperties={() => {
            console.log('Properties');
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
};

