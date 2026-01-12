'use client';

import React, { useRef, useEffect } from 'react';
import { useWindowStore, DesktopIcon as DesktopIconType } from '@/stores/windowStore';
import { useDraggable } from '@/hooks/useDraggable';
import { Icon } from '@/components/Icons/IconMapper';

interface DesktopIconProps {
  icon: DesktopIconType;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  icon,
  isSelected,
  onSelect,
  onDoubleClick,
}) => {
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateIconPosition = useWindowStore((state) => state.updateIconPosition);

  const { ref: dragRef, handleMouseDown, isDragging } = useDraggable({
    position: icon.position,
    bounds: 'parent',
    onDrag: (position) => {
      updateIconPosition(icon.id, position);
    },
  });

  const handleClick = () => {
    if (!isDragging) {
      onSelect();
    }
  };

  const handleDoubleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    onDoubleClick();
  };

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Combine refs
  const combinedRef = useRef<HTMLDivElement | null>(null);
  const setRefs = (node: HTMLDivElement | null) => {
    combinedRef.current = node;
    if (dragRef) {
      (dragRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  };

  return (
    <div
      ref={setRefs}
      className={`desktop-icon ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        cursor: 'pointer',
        left: `${icon.position.x}px`,
        top: `${icon.position.y}px`,
      }}
    >
        <div className="desktop-icon-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon.icon} size={32} />
        </div>
        <div className="desktop-icon-label">{icon.label}</div>
      </div>
  );
};

