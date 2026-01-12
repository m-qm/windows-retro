'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface UseDraggableOptions {
  onDrag?: (position: { x: number; y: number }) => void;
  onDragStart?: (position: { x: number; y: number }) => void;
  onDragStop?: (position: { x: number; y: number }) => void;
  disabled?: boolean;
  bounds?: 'parent' | { left?: number; right?: number; top?: number; bottom?: number };
  position?: { x: number; y: number };
}

export const useDraggable = (options: UseDraggableOptions = {}) => {
  const {
    onDrag,
    onDragStart,
    onDragStop,
    disabled = false,
    bounds,
    position = { x: 0, y: 0 },
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(position);
  const elementRef = useRef<HTMLElement | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const positionRef = useRef(position);

  const constrainPosition = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      if (!bounds || bounds === 'parent') {
        return { x, y };
      }

      let constrainedX = x;
      let constrainedY = y;

      if (bounds.left !== undefined) {
        constrainedX = Math.max(constrainedX, bounds.left);
      }
      if (bounds.right !== undefined) {
        constrainedX = Math.min(constrainedX, bounds.right);
      }
      if (bounds.top !== undefined) {
        constrainedY = Math.max(constrainedY, bounds.top);
      }
      if (bounds.bottom !== undefined) {
        constrainedY = Math.min(constrainedY, bounds.bottom);
      }

      return { x: constrainedX, y: constrainedY };
    },
    [bounds]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      if (!elementRef.current) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startPosX = dragPosition.x;
      const startPosY = dragPosition.y;

      startPosRef.current = { x: startX, y: startY };

      setIsDragging(true);

      if (onDragStart) {
        onDragStart(dragPosition);
      }

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startPosRef.current.x;
        const deltaY = e.clientY - startPosRef.current.y;

        let newX = startPosX + deltaX;
        let newY = startPosY + deltaY;

        // Apply bounds if parent
        if (bounds === 'parent' && elementRef.current?.parentElement) {
          const parent = elementRef.current.parentElement;
          const parentRect = parent.getBoundingClientRect();
          const elementRect = elementRef.current.getBoundingClientRect();

          newX = Math.max(0, Math.min(newX, parentRect.width - elementRect.width));
          newY = Math.max(0, Math.min(newY, parentRect.height - elementRect.height));
        } else if (bounds && bounds !== 'parent') {
          const constrained = constrainPosition(newX, newY);
          newX = constrained.x;
          newY = constrained.y;
        }

        const newPosition = { x: newX, y: newY };
        setDragPosition(newPosition);

        if (onDrag) {
          onDrag(newPosition);
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);

        if (onDragStop) {
          onDragStop(dragPosition);
        }

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [disabled, dragPosition, onDrag, onDragStart, onDragStop, bounds, constrainPosition]
  );

  useEffect(() => {
    // Only update if position actually changed to avoid infinite loops
    if (positionRef.current.x !== position.x || positionRef.current.y !== position.y) {
      positionRef.current = position;
      setDragPosition(position);
    }
  }, [position.x, position.y]);

  return {
    ref: elementRef,
    isDragging,
    position: dragPosition,
    handleMouseDown,
  };
};

