'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useWindowStore, WindowState } from '@/stores/windowStore';
import { TitleBar } from './TitleBar';
import { useDraggable } from '@/hooks/useDraggable';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;
const RESIZE_HANDLE_SIZE = 8;

export const Window: React.FC<WindowProps> = ({ window, children }) => {
  const {
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    closeWindow,
    updateWindow,
  } = useWindowStore();

  const windowRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const isActive = useWindowStore((state) => state.activeWindowId === window.id);

  useEffect(() => {
    if (isActive && windowRef.current) {
      windowRef.current.focus();
    }
  }, [isActive]);

  const handleFocus = useCallback(() => {
    focusWindow(window.id);
  }, [window.id, focusWindow]);

  const { ref: dragRef, handleMouseDown } = useDraggable({
    disabled: window.isMaximized || isResizing,
    position: window.isMaximized ? { x: 0, y: 0 } : window.position,
    onDrag: (position) => {
      if (!window.isMaximized) {
        updateWindow(window.id, {
          position,
        });
      }
    },
  });

  const handleStartResize = useCallback((direction: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: window.size.width,
      height: window.size.height,
    });
  }, [window.size]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = window.position.x;
      let newY = window.position.y;

      if (resizeDirection.includes('right')) {
        newWidth = Math.max(MIN_WIDTH, resizeStart.width + deltaX);
      }
      if (resizeDirection.includes('left')) {
        newWidth = Math.max(MIN_WIDTH, resizeStart.width - deltaX);
        newX = window.position.x + (resizeStart.width - newWidth);
      }
      if (resizeDirection.includes('bottom')) {
        newHeight = Math.max(MIN_HEIGHT, resizeStart.height + deltaY);
      }
      if (resizeDirection.includes('top')) {
        newHeight = Math.max(MIN_HEIGHT, resizeStart.height - deltaY);
        newY = window.position.y + (resizeStart.height - newHeight);
      }

      updateWindow(window.id, {
        size: { width: newWidth, height: newHeight },
        position: { x: newX, y: newY },
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, resizeStart, window, updateWindow]);

  // Don't render minimized windows - this prevents hook issues with lazy-loaded children
  if (window.isMinimized) {
    return null;
  }

  const windowStyle: React.CSSProperties = {
    position: 'absolute',
    width: window.isMaximized ? '100vw' : `${window.size.width}px`,
    height: window.isMaximized ? 'calc(100vh - 30px)' : `${window.size.height}px`,
    left: window.isMaximized ? 0 : `${window.position.x}px`,
    top: window.isMaximized ? 0 : `${window.position.y}px`,
    zIndex: window.zIndex,
    display: 'flex',
    flexDirection: 'column',
  };

  const ResizeHandle: React.FC<{ position: string; cursor: string }> = ({ position, cursor }) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      cursor,
      zIndex: 10,
    };

    if (position.includes('top')) {
      style.top = 0;
      style.height = `${RESIZE_HANDLE_SIZE}px`;
    }
    if (position.includes('bottom')) {
      style.bottom = 0;
      style.height = `${RESIZE_HANDLE_SIZE}px`;
    }
    if (position.includes('left')) {
      style.left = 0;
      style.width = `${RESIZE_HANDLE_SIZE}px`;
    }
    if (position.includes('right')) {
      style.right = 0;
      style.width = `${RESIZE_HANDLE_SIZE}px`;
    }

    return (
      <div
        style={style}
        onMouseDown={(e) => handleStartResize(position, e)}
      />
    );
  };

  // Combine refs
  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      windowRef.current = node;
      if (dragRef) {
        (dragRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    [dragRef]
  );

  return (
    <div
      ref={combinedRef}
      className="win-window"
      style={windowStyle}
      onClick={handleFocus}
      tabIndex={0}
    >
      <TitleBar
        title={window.title}
        icon={window.icon}
        isActive={isActive}
        onMinimize={() => minimizeWindow(window.id)}
        onMaximize={() => {
          if (window.isMaximized) {
            restoreWindow(window.id);
          } else {
            maximizeWindow(window.id);
          }
        }}
        onClose={() => closeWindow(window.id)}
        isMaximized={window.isMaximized}
        onMouseDown={handleMouseDown}
      />
      <div className="win-content" style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
      {!window.isMaximized && (
        <>
          <ResizeHandle position="top" cursor="n-resize" />
          <ResizeHandle position="bottom" cursor="s-resize" />
          <ResizeHandle position="left" cursor="w-resize" />
          <ResizeHandle position="right" cursor="e-resize" />
          <ResizeHandle position="top-left" cursor="nw-resize" />
          <ResizeHandle position="top-right" cursor="ne-resize" />
          <ResizeHandle position="bottom-left" cursor="sw-resize" />
          <ResizeHandle position="bottom-right" cursor="se-resize" />
        </>
      )}
    </div>
  );
};

