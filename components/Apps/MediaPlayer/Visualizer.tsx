'use client';

import React, { useEffect, useRef } from 'react';
import { useAudioVisualizer, VisualizerMode } from '@/hooks/useAudioVisualizer';

interface VisualizerProps {
  audioElement: HTMLAudioElement | null;
  enabled: boolean;
  mode: VisualizerMode;
  width?: number;
  height?: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  audioElement,
  enabled,
  mode,
  width = 400,
  height = 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { getData } = useAudioVisualizer({ audioElement, enabled, mode });
  const previousDataRef = useRef<Uint8Array | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!enabled || !canvasRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!ctx || !canvas) return;

      const data = getData();
      if (!data) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += 0.01;

      // Slight fade trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (mode === 'battery') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY);
        const coreRadius = maxRadius * 0.25;
        const average = data.reduce((acc, val) => acc + val, 0) / (data.length * 255);
        timeRef.current += 0.02 + average * 0.05;

        // Deep blue nebula background
        const bgGradient = ctx.createRadialGradient(centerX, centerY, coreRadius * 0.5, centerX, centerY, maxRadius);
        bgGradient.addColorStop(0, '#10204d');
        bgGradient.addColorStop(0.4, '#07113a');
        bgGradient.addColorStop(1, '#01010b');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(centerX, centerY);

        // Core energy orb
        const orbGradient = ctx.createRadialGradient(0, 0, coreRadius * 0.2, 0, 0, coreRadius * 1.5);
        orbGradient.addColorStop(0, 'rgba(120, 180, 255, 0.9)');
        orbGradient.addColorStop(0.5, 'rgba(40, 110, 220, 0.7)');
        orbGradient.addColorStop(1, 'rgba(0, 20, 60, 0.2)');
        ctx.shadowColor = 'rgba(80, 150, 255, 0.8)';
        ctx.shadowBlur = 60;
        ctx.fillStyle = orbGradient;
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius * (1 + average * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Electric tendrils
        const rays = 160;
        const dataLen = data.length;
        for (let i = 0; i < rays; i++) {
          const dataIndex = Math.floor((i / rays) * dataLen);
          const amplitude = data[dataIndex] / 255;
          const angle = (i / rays) * Math.PI * 2 + timeRef.current;
          const inner = coreRadius * (0.8 + amplitude * 0.3);
          const outer = coreRadius + amplitude * maxRadius * 0.8 + Math.sin(timeRef.current + i) * 10;

          ctx.strokeStyle = `rgba(40, ${120 + amplitude * 120}, 255, ${0.1 + amplitude * 0.6})`;
          ctx.lineWidth = 0.5 + amplitude * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
          ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
          ctx.stroke();
        }

        // Swirling ribbons
        ctx.globalCompositeOperation = 'lighter';
        const swirls = 4;
        for (let s = 0; s < swirls; s++) {
          const offset = timeRef.current * (0.6 + s * 0.2);
          ctx.beginPath();
          for (let angle = 0; angle <= Math.PI * 2 + 0.1; angle += Math.PI / 180) {
            const index = Math.floor((angle / (Math.PI * 2)) * dataLen) % dataLen;
            const amplitude = data[index] / 255;
            const radius = coreRadius * 1.2 + amplitude * maxRadius * 0.5;
            const x = Math.cos(angle + offset) * radius;
            const y = Math.sin(angle + offset) * radius;
            if (angle === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.strokeStyle = `rgba(80, 180, 255, ${0.08 + s * 0.04})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';

        ctx.restore();

        // store data for possible smoothing use
        previousDataRef.current = new Uint8Array(data);
      } else if (mode === 'bars') {
        // Enhanced bar spectrum analyzer with cool effects
        const barCount = Math.min(data.length, 128);
        const barWidth = canvas.width / barCount;
        const centerY = canvas.height / 2;

        for (let i = 0; i < barCount; i++) {
          const value = data[i];
          const normalizedValue = value / 255;
          
          // Smooth bar height with previous data
          const previousValue = previousDataRef.current ? previousDataRef.current[i] / 255 : 0;
          const smoothValue = previousValue * 0.7 + normalizedValue * 0.3;
          
          // Create mirrored bars (top and bottom)
          const barHeight = smoothValue * canvas.height * 0.4;
          
          // Dynamic color based on frequency and time
          const hue = (i / barCount) * 360 + timeRef.current * 50;
          const saturation = 70 + normalizedValue * 30;
          const lightness = 40 + normalizedValue * 60;
          
          // Top bar
          const gradientTop = ctx.createLinearGradient(
            i * barWidth, centerY - barHeight,
            i * barWidth, centerY
          );
          gradientTop.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
          gradientTop.addColorStop(0.5, `hsl(${hue + 30}, ${saturation}%, ${lightness - 20}%)`);
          gradientTop.addColorStop(1, `hsl(${hue + 60}, ${saturation}%, ${lightness - 40}%)`);
          
          ctx.fillStyle = gradientTop;
          ctx.fillRect(i * barWidth, centerY - barHeight, barWidth - 2, barHeight);
          
          // Bottom bar (mirrored)
          const gradientBottom = ctx.createLinearGradient(
            i * barWidth, centerY,
            i * barWidth, centerY + barHeight
          );
          gradientBottom.addColorStop(0, `hsl(${hue + 60}, ${saturation}%, ${lightness - 40}%)`);
          gradientBottom.addColorStop(0.5, `hsl(${hue + 30}, ${saturation}%, ${lightness - 20}%)`);
          gradientBottom.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
          
          ctx.fillStyle = gradientBottom;
          ctx.fillRect(i * barWidth, centerY, barWidth - 2, barHeight);
          
          // Add glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          ctx.fillRect(i * barWidth, centerY - barHeight, barWidth - 2, barHeight * 2);
          ctx.shadowBlur = 0;
        }
        
        // Store previous data for smoothing
        previousDataRef.current = new Uint8Array(data);
        
        // Add center line with pulse effect
        const pulse = Math.sin(timeRef.current * 5) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + pulse * 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();
        
      } else if (mode === 'waveform') {
        // Enhanced waveform with cool effects
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        
        // Main waveform
        ctx.beginPath();
        const sliceWidth = canvas.width / data.length;
        let x = 0;
        const centerY = canvas.height / 2;

        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128.0;
          const y = centerY + (v - 1) * (canvas.height * 0.4);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }
        ctx.stroke();
        
        // Add mirrored waveform below
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128.0;
          const y = centerY - (v - 1) * (canvas.height * 0.4);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }
        ctx.stroke();
        
        // Add gradient overlay
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.05)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.05)');
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        ctx.shadowBlur = 0;
        
        // Add particles effect
        for (let i = 0; i < 20; i++) {
          const particleX = (i / 20) * canvas.width;
          const particleIndex = Math.floor((i / 20) * data.length);
          const particleValue = data[particleIndex] / 255;
          const particleY = centerY + (particleValue - 0.5) * canvas.height * 0.6;
          
          ctx.fillStyle = `rgba(0, 255, 255, ${0.5 + particleValue * 0.5})`;
          ctx.beginPath();
          ctx.arc(particleX, particleY, 2 + particleValue * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Scope mode - classic WMP scope visualization
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRadius = Math.min(centerX, centerY) * 0.85;
        const len = data.length;
        timeRef.current += 0.01;

        // Background gradient
        const bgGradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.2, centerX, centerY, baseRadius);
        bgGradient.addColorStop(0, '#020818');
        bgGradient.addColorStop(0.5, '#04133a');
        bgGradient.addColorStop(1, '#010209');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(centerX, centerY);

        // Scope grid
        ctx.strokeStyle = 'rgba(0, 120, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let r = baseRadius * 0.3; r <= baseRadius; r += baseRadius * 0.2) {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * baseRadius, Math.sin(angle) * baseRadius);
          ctx.stroke();
        }

        // Outer glow ring
        ctx.shadowBlur = 25;
        ctx.shadowColor = 'rgba(0, 180, 255, 0.6)';
        ctx.strokeStyle = 'rgba(0, 180, 255, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Scope waveform (polar)
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(90, 200, 255, 0.9)';
        ctx.beginPath();
        for (let i = 0; i < len; i++) {
          const value = data[i] / 255;
          const angle = (i / len) * Math.PI * 2 + timeRef.current * 0.3;
          const radius = baseRadius * (0.45 + value * 0.45);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();

        // Fill with gradient glow
        const scopeGradient = ctx.createRadialGradient(0, 0, baseRadius * 0.2, 0, 0, baseRadius);
        scopeGradient.addColorStop(0, 'rgba(60, 180, 255, 0.15)');
        scopeGradient.addColorStop(1, 'rgba(60, 180, 255, 0.02)');
        ctx.fillStyle = scopeGradient;
        ctx.fill();

        // Orbiting particles
        const particles = 24;
        for (let i = 0; i < particles; i++) {
          const progress = (i / particles) * Math.PI * 2 + timeRef.current * 0.6;
          const index = Math.floor((i / particles) * len) % len;
          const magnitude = data[index] / 255;
          const radius = baseRadius * (0.2 + magnitude * 0.7);
          const x = Math.cos(progress) * radius;
          const y = Math.sin(progress) * radius;

          ctx.fillStyle = `rgba(100, 200, 255, ${0.2 + magnitude * 0.8})`;
          ctx.beginPath();
          ctx.arc(x, y, 2 + magnitude * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, mode, getData]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background: 'radial-gradient(circle at center, #001122 0%, #000000 100%)',
      }}
    />
  );
};
