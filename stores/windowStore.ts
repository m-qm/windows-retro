import { create } from 'zustand';

export type WindowType = 
  | 'media-player' 
  | 'photo-viewer' 
  | 'video-player' 
  | 'notepad' 
  | 'my-computer' 
  | 'internet-explorer'
  | 'minesweeper'
  | 'solitaire';

export interface WindowState {
  id: string;
  type: WindowType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  icon?: string;
  url?: string; // For Internet Explorer windows
}

export interface DesktopIcon {
  id: string;
  label: string;
  icon: string;
  windowType: WindowType;
  position: { x: number; y: number };
}

export interface MediaPlayerState {
  currentTrack: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  isRepeating: boolean;
  playlist: Array<{
    id: string;
    title: string;
    artist: string;
    url: string;
    duration?: number;
  }>;
}

interface WindowStore {
  windows: WindowState[];
  activeWindowId: string | null;
  nextZIndex: number;
  desktopIcons: DesktopIcon[];
  mediaPlayerState: MediaPlayerState;
  
  // Window actions
  openWindow: (type: WindowType, title: string, icon?: string, url?: string) => string;
  closeWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<WindowState>) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  
  // Desktop icon actions
  updateIconPosition: (id: string, position: { x: number; y: number }) => void;
  
  // Media player actions
  setCurrentTrack: (index: number) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
}

const defaultWindowSize = {
  width: 600,
  height: 400,
};

const defaultMediaPlayerSize = {
  width: 500,
  height: 400,
};

const defaultBrowserSize = {
  width: 900,
  height: 700,
};

const getDefaultPosition = (index: number) => ({
  x: 50 + (index % 3) * 50,
  y: 50 + Math.floor(index / 3) * 50,
});

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  activeWindowId: null,
  nextZIndex: 1,
  desktopIcons: [
    {
      id: 'icon-media-player',
      label: 'Windows Media Player',
      icon: 'media-player',
      windowType: 'media-player',
      position: { x: 20, y: 20 },
    },
    {
      id: 'icon-my-pictures',
      label: 'My Pictures',
      icon: 'my-pictures',
      windowType: 'photo-viewer',
      position: { x: 20, y: 120 },
    },
    {
      id: 'icon-my-videos',
      label: 'My Videos',
      icon: 'my-videos',
      windowType: 'video-player',
      position: { x: 20, y: 220 },
    },
    {
      id: 'icon-my-computer',
      label: 'My Computer',
      icon: 'my-computer',
      windowType: 'my-computer',
      position: { x: 20, y: 320 },
    },
    {
      id: 'icon-notepad',
      label: 'Notepad',
      icon: 'notepad',
      windowType: 'notepad',
      position: { x: 20, y: 420 },
    },
    {
      id: 'icon-recycle-bin',
      label: 'Recycle Bin',
      icon: 'recycle-bin',
      windowType: 'my-computer',
      position: { x: 20, y: 520 },
    },
    {
      id: 'icon-internet-explorer',
      label: 'Internet Explorer',
      icon: 'internet-explorer',
      windowType: 'internet-explorer',
      position: { x: 20, y: 620 },
    },
  ],
  mediaPlayerState: {
    currentTrack: 0,
    isPlaying: false,
    volume: 0.7,
    isMuted: false,
    isShuffled: false,
    isRepeating: false,
    playlist: [
      {
        id: 'track1',
        title: 'A$AP Rocky - Wassup',
        artist: 'A$AP Rocky',
        url: '/audio/04. A$AP Rocky - Wassup.mp3',
      },
      {
        id: 'track2',
        title: '01 - I Smoked Away My Brain',
        artist: 'I\'m God x Demons Mashup',
        url: '/audio/01 - I Smoked Away My Brain.mp3',
      },
      {
        id: 'video1',
        title: 'Video',
        artist: 'Video File',
        url: '/videos/1_compressed.mp4',
      },
      {
        id: 'track3',
        title: 'Visages',
        artist: 'The Hidden Valley', 
        url: '/audio/Visajes The Hidden Valley.mp3',
      },
    ],
  },

  openWindow: (type, title, icon, url) => {
    const state = get();
    // For Internet Explorer, allow multiple windows with different URLs
    const existingWindow = type === 'internet-explorer' && url
      ? null // Always create new window for popups
      : state.windows.find(w => w.type === type && !w.isMinimized);
    
    if (existingWindow) {
      get().focusWindow(existingWindow.id);
      get().restoreWindow(existingWindow.id);
      return existingWindow.id;
    }

    const windowCount = state.windows.length;
    let size = defaultWindowSize;
    if (type === 'media-player') {
      size = defaultMediaPlayerSize;
    } else if (type === 'internet-explorer') {
      size = defaultBrowserSize;
    }
    const position = getDefaultPosition(windowCount);

    const newWindow: WindowState = {
      id: `window-${Date.now()}-${Math.random()}`,
      type,
      title,
      position,
      size,
      isMinimized: false,
      isMaximized: false,
      zIndex: state.nextZIndex,
      icon,
      url,
    };

    set({
      windows: [...state.windows, newWindow],
      activeWindowId: newWindow.id,
      nextZIndex: state.nextZIndex + 1,
    });

    return newWindow.id;
  },

  closeWindow: (id) => {
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    }));
  },

  updateWindow: (id, updates) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    }));
  },

  focusWindow: (id) => {
    const state = get();
    const window = state.windows.find((w) => w.id === id);
    if (!window) return;

    set({
      activeWindowId: id,
      nextZIndex: state.nextZIndex + 1,
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, zIndex: state.nextZIndex } : w
      ),
    });
  },

  minimizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: true } : w
      ),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    }));
  },

  maximizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: true } : w
      ),
    }));
  },

  restoreWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: false, isMaximized: false } : w
      ),
    }));
  },

  updateIconPosition: (id, position) => {
    set((state) => ({
      desktopIcons: state.desktopIcons.map((icon) =>
        icon.id === id ? { ...icon, position } : icon
      ),
    }));
  },

  setCurrentTrack: (index) => {
    set((state) => ({
      mediaPlayerState: {
        ...state.mediaPlayerState,
        currentTrack: index,
      },
    }));
  },

  togglePlay: () => {
    set((state) => ({
      mediaPlayerState: {
        ...state.mediaPlayerState,
        isPlaying: !state.mediaPlayerState.isPlaying,
      },
    }));
  },

  setVolume: (volume) => {
    set((state) => ({
      mediaPlayerState: {
        ...state.mediaPlayerState,
        volume: Math.max(0, Math.min(1, volume)),
      },
    }));
  },

  toggleMute: () => {
    set((state) => ({
      mediaPlayerState: {
        ...state.mediaPlayerState,
        isMuted: !state.mediaPlayerState.isMuted,
      },
    }));
  },

  toggleShuffle: () => {
    set((state) => ({
      mediaPlayerState: {
        ...state.mediaPlayerState,
        isShuffled: !state.mediaPlayerState.isShuffled,
      },
    }));
  },

  toggleRepeat: () => {
    set((state) => ({
      mediaPlayerState: {
        ...state.mediaPlayerState,
        isRepeating: !state.mediaPlayerState.isRepeating,
      },
    }));
  },

  nextTrack: () => {
    const state = get();
    const { currentTrack, playlist, isShuffled } = state.mediaPlayerState;
    
    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      get().setCurrentTrack(randomIndex);
    } else {
      const nextIndex = (currentTrack + 1) % playlist.length;
      get().setCurrentTrack(nextIndex);
    }
  },

  previousTrack: () => {
    const state = get();
    const { currentTrack, playlist } = state.mediaPlayerState;
    const prevIndex = currentTrack === 0 ? playlist.length - 1 : currentTrack - 1;
    get().setCurrentTrack(prevIndex);
  },
}));

