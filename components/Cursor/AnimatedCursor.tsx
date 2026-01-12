'use client';

import React, { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export const AnimatedCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY };
      setPosition(newPos);
      
      // Create particles when cursor moves
      const distance = Math.sqrt(
        Math.pow(newPos.x - lastPositionRef.current.x, 2) + 
        Math.pow(newPos.y - lastPositionRef.current.y, 2)
      );
      
      if (distance > 2) {
        // Create spark particles
        const newParticles: Particle[] = [];
        const particleCount = Math.min(Math.floor(distance / 5), 3);
        
        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 1.5;
          const colors = ['#ffffff', '#ffff00', '#00ffff', '#ff00ff', '#ffaa00'];
          
          newParticles.push({
            id: particleIdRef.current++,
            x: newPos.x + (Math.random() - 0.5) * 10,
            y: newPos.y + (Math.random() - 0.5) * 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 0.5 + Math.random() * 0.5,
            size: 2 + Math.random() * 3,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
        
        setParticles((prev) => [...prev, ...newParticles]);
      }
      
      lastPositionRef.current = newPos;
    };

    // Animate particles
    const animateParticles = () => {
      setParticles((prev) => {
        return prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vx: particle.vx * 0.95, // Friction
            vy: particle.vy * 0.95,
            life: particle.life - 0.02,
          }))
          .filter((particle) => particle.life > 0);
      });
      
      animationFrameRef.current = requestAnimationFrame(animateParticles);
    };

    animationFrameRef.current = requestAnimationFrame(animateParticles);

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
      {/* Spark particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'fixed',
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            pointerEvents: 'none',
            zIndex: 99998,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            borderRadius: '50%',
            background: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            opacity: particle.life / particle.maxLife,
            transform: `translate(-50%, -50%) scale(${particle.life})`,
            transition: 'none',
          }}
        />
      ))}
    </>
  );
};
