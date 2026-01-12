'use client';

import { Desktop } from '@/components/Desktop/Desktop';
import { Taskbar } from '@/components/Desktop/Taskbar';
import { AnimatedCursor } from '@/components/Cursor/AnimatedCursor';

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Desktop />
      <Taskbar />
      <AnimatedCursor />
    </div>
  );
}
