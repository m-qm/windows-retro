# Windows 98/XP Retro Simulator

A nostalgic Windows 98/XP-style desktop simulation built with Next.js 14+, TypeScript, and Tailwind CSS.

## Features

- **Full Desktop Environment**: Classic Windows 98/XP desktop with gradient background
- **Window System**: Draggable, resizable windows with minimize, maximize, and close controls
- **Desktop Icons**: Interactive icons that can be dragged and double-clicked to open applications
- **Taskbar**: Start menu, window task buttons, and system tray with clock
- **Windows Media Player**: Full media player with audio visualizer (bar spectrum and waveform modes)
- **Photo Viewer**: Image viewer with zoom, rotate, and slideshow features
- **Video Player**: HTML5 video player with fullscreen support
- **My Computer**: File explorer simulation
- **Notepad**: Text editor with file operations

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Adding Media Files

### Audio Files
Place MP3 files in `/public/audio/` and update the playlist in `stores/windowStore.ts`:

```typescript
playlist: [
  {
    id: 'track1',
    title: 'Your Track Name',
    artist: 'Artist Name',
    url: '/audio/your-track.mp3',
  },
]
```

### Images
Place image files (JPG, PNG, etc.) in `/public/images/` and update the `SAMPLE_IMAGES` array in `components/Apps/PhotoViewer/PhotoViewer.tsx`.

### Videos
Place MP4 files in `/public/videos/` and update the `SAMPLE_VIDEOS` array in `components/Apps/VideoPlayer/VideoPlayer.tsx`.

### Icons
Place icon images (32x32 or 48x48 pixels) in `/public/icons/` and update the desktop icons in `stores/windowStore.ts`.

## Project Structure

```
/app
  /page.tsx - Main desktop page
  /layout.tsx - Root layout
/components
  /Desktop - Desktop environment components
  /Window - Window system components
  /Apps - Application components
    /MediaPlayer - Windows Media Player
    /PhotoViewer - Image viewer
    /VideoPlayer - Video player
    /MyComputer - File explorer
    /Notepad - Text editor
/stores - Zustand state management
/hooks - Custom React hooks
/styles - Windows 98/XP styling
```

## Technologies Used

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- react-draggable (window dragging)
- Web Audio API (audio visualizer)

## License

MIT
