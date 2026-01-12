# Icon Library Usage

This project uses the **react-old-icons** library, which provides over 2,300 classic Windows icons from Windows 95, 98, XP, Vista, and 7.

## Installation

The library is already installed:
```bash
npm install react-old-icons
```

## Usage

### Using the Icon Component

The easiest way to use icons is through the `Icon` component:

```tsx
import { Icon } from '@/components/Icons/IconMapper';

// In your component
<Icon name="notepad" size={32} />
<Icon name="my-computer" size={48} />
```

### Available Icon Names

The following icon names are pre-configured in `components/Icons/IconMapper.tsx`:

- `notepad` - Windows 95 Notepad icon
- `my-computer` - Windows 95 My Computer icon
- `my-pictures` - User Pictures icon
- `my-videos` - Windows Videos icon
- `recycle-bin` - Windows 95 Recycle Bin icon
- `media-player` - Windows Media Player icon

### Using Icons Directly

You can also import and use icons directly from `react-old-icons`:

```tsx
import { Windows95Notepad, Windows95MyComputer } from 'react-old-icons';

<Windows95Notepad size={32} />
<Windows95MyComputer size={48} />
```

### Adding New Icons

To add a new icon to the mapping:

1. Import the icon from `react-old-icons` in `components/Icons/IconMapper.tsx`
2. Add it to the `iconMap` object:

```tsx
export const iconMap: Record<string, IconComponent> = {
  // ... existing icons
  'new-icon-name': YourIconComponent,
};
```

### Finding Available Icons

To see all available icons, visit the [React Old Icons Interactive Browser](https://gsnoopy.github.io/react-old-icons/).

Or check programmatically:

```bash
node -e "const icons = require('react-old-icons'); console.log(Object.keys(icons).join('\n'))"
```

### Common Windows 95/98 Icons

Some useful icons you might want to use:

- `Windows95Notepad`
- `Windows95MyComputer`
- `Windows95RecycleBin`
- `Windows95Access`
- `Windows95File`
- `WindowsVideos`
- `UserPictures`
- `WindowsMediaPlayer`

## Icon Props

All icons accept these props:

- `size?: number` - Icon size in pixels (default: 32)
- `className?: string` - CSS class name
- `style?: React.CSSProperties` - Inline styles

Example:

```tsx
<Icon 
  name="notepad" 
  size={48} 
  className="my-icon" 
  style={{ color: 'blue' }} 
/>
```

## Current Usage

Icons are currently used in:

- **Desktop Icons** (`components/Desktop/DesktopIcon.tsx`) - 32x32px
- **Window Title Bars** (`components/Window/TitleBar.tsx`) - 16x16px
- **Taskbar** (`components/Desktop/Taskbar.tsx`) - 16x16px

## Resources

- [React Old Icons Documentation](https://gsnoopy.github.io/react-old-icons/)
- [NPM Package](https://www.npmjs.com/package/react-old-icons)
- [Windows 98 Icon Viewer](https://win98icons.alexmeub.com/) - For reference and inspiration

