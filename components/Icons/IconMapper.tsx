'use client';

import React from 'react';
import {
  Windows95Notepad,
  WindowsVideos,
  Windows95RecycleBin,
  UserPictures,
  Windows95MyComputer,
  WindowsMediaPlayer,
  InternetExplorer,
} from 'react-old-icons';

// Icon component type
type IconComponent = React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;

// Fallback icon component
const DefaultIcon: IconComponent = ({ size = 32, className, style }) => (
  <div
    style={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.8,
      ...style,
    }}
    className={className}
  >
    📁
  </div>
);

// Icon mapping
export const iconMap: Record<string, IconComponent> = {
  'notepad': Windows95Notepad,
  'my-computer': Windows95MyComputer,
  'my-pictures': UserPictures,
  'my-videos': WindowsVideos,
  'recycle-bin': Windows95RecycleBin,
  'media-player': WindowsMediaPlayer || DefaultIcon,
  'internet-explorer': InternetExplorer || DefaultIcon,
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ name, size = 32, className, style }) => {
  const IconComponent = iconMap[name.toLowerCase()] || DefaultIcon;
  
  return (
    <IconComponent
      size={size}
      className={className}
      style={style}
    />
  );
};

// Export individual icon components for direct use
export {
  Windows95Notepad,
  WindowsVideos,
  Windows95RecycleBin,
  UserPictures,
  Windows95MyComputer,
  WindowsMediaPlayer,
  InternetExplorer,
};
