'use client';

import React, { useEffect, useState, useRef } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const AnimatedCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY };
      setPosition(newPos);
      
      // Add point to trail
      setTrail((prev) => {
        const newTrail = [
          ...prev,
          { x: newPos.x, y: newPos.y, timestamp: Date.now() }
        ];
        // Keep only last 8 points for a subtle trail
        return newTrail.slice(-8);
      });
    };

    // Clean up old trail points
    const cleanupTrail = () => {
      const now = Date.now();
      setTrail((prev) => 
        prev.filter((point) => now - point.timestamp < 200)
      );
      animationFrameRef.current = requestAnimationFrame(cleanupTrail);
    };

    animationFrameRef.current = requestAnimationFrame(cleanupTrail);

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Retro cursor trail - Windows 98 style */}
      {trail.map((point, index) => {
        const opacity = (index + 1) / trail.length * 0.3;
        const size = 4 + (index / trail.length) * 2;
        
        return (
          <div
            key={`${point.x}-${point.y}-${point.timestamp}`}
            style={{
              position: 'fixed',
              left: `${point.x}px`,
              top: `${point.y}px`,
              pointerEvents: 'none',
              zIndex: 99998,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(0, 120, 215, ${opacity}) 0%, rgba(0, 120, 215, 0) 70%)`,
              border: `1px solid rgba(0, 120, 215, ${opacity * 0.5})`,
              transform: 'translate(-50%, -50%)',
              transition: 'none',
            }}
          />
        );
      })}
      
      {/* Main cursor glow */}
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          pointerEvents: 'none',
          zIndex: 99999,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'rgba(0, 120, 215, 0.6)',
          border: '1px solid rgba(0, 120, 215, 0.8)',
          boxShadow: '0 0 8px rgba(0, 120, 215, 0.4)',
          transform: 'translate(-50%, -50%)',
          transition: 'none',
        }}
      />
    </>
  );
};
