'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWindowStore } from '@/stores/windowStore';

interface InternetExplorerProps {
  url?: string;
  videoPath?: string; // Path to video file in public folder (e.g., '/videos/my-video.mp4')
}

export const InternetExplorer: React.FC<InternetExplorerProps> = ({ 
    url,
    videoPath
}) => {
  const [displayUrl, setDisplayUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const openWindow = useWindowStore((state) => state.openWindow);

  // Set display URL based on videoPath or url
  useEffect(() => {
    if (videoPath) {
      // Extract filename from path for display
      const fileName = videoPath.split('/').pop() || videoPath;
      setDisplayUrl(fileName);
    } else if (url) {
      setDisplayUrl(url);
    }
  }, [videoPath, url]);

  const isLocalVideo = !!videoPath;

  // Update time and duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Sync volume
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle opening controls window manually (only for web URLs)
  const handleOpenControls = () => {
    if (isLocalVideo) {
      alert('Controls window is only available for web URLs');
      return;
    }
    
    if (url) {
      const baseUrl = url.replace(/\/$/, '');
      const controlsUrl = baseUrl + '/controls.html';
      openWindow('internet-explorer', 'Internet Explorer - Controls', 'internet-explorer', controlsUrl);
    }
  };

  useEffect(() => {
    // Skip all window.open interception for local videos
    if (isLocalVideo || !url) {
      return;
    }

    // Store original window.open
    const originalOpen = window.open;
    const baseUrl = url.replace(/\/$/, '');

    // Override window.open to intercept popup requests
    const interceptedOpen = function(popupUrl?: string | URL, target?: string, features?: string) {
      let urlString = '';
      if (popupUrl) {
        urlString = typeof popupUrl === 'string' ? popupUrl : popupUrl.toString();
      }
      
      if (!urlString || urlString.trim() === '') {
        return originalOpen.call(window, popupUrl, target, features);
      }
      
      // Handle relative URLs - convert to absolute
      if (urlString.startsWith('/')) {
        urlString = baseUrl + urlString;
      } else if (!urlString.includes('://') && !urlString.startsWith('#') && !urlString.startsWith('javascript:') && !urlString.startsWith('about:')) {
        urlString = baseUrl + '/' + urlString;
      }
      
      let finalUrl = urlString;
      if (!finalUrl.includes('://')) {
        if (finalUrl.startsWith('/')) {
          finalUrl = baseUrl + finalUrl;
        } else if (finalUrl) {
          finalUrl = baseUrl + '/' + finalUrl;
        }
      }
      
      if (finalUrl === baseUrl || finalUrl === baseUrl + '/' || finalUrl === url) {
        return originalOpen.call(window, popupUrl, target, features);
      }
      
      const isControlsPopup = finalUrl.includes('controls.html') || finalUrl.endsWith('/controls');
      const isOurDomain = finalUrl.includes('camera-effects.vercel.app') || 
                         (finalUrl.startsWith(baseUrl) && finalUrl !== baseUrl && finalUrl !== baseUrl + '/');
      
      if (isControlsPopup || isOurDomain) {
        console.log('Intercepting popup:', urlString, '-> Opening full window:', finalUrl);
        openWindow('internet-explorer', 'Internet Explorer - Controls', 'internet-explorer', finalUrl);
        return {
          closed: false,
          close: () => {},
          focus: () => {},
          blur: () => {},
          postMessage: () => {},
        } as unknown as Window;
      }

      return originalOpen.call(window, popupUrl, target, features);
    };

    window.open = interceptedOpen;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'IE_POPUP_REQUEST') {
        let popupUrl = event.data.url;
        if (popupUrl) {
          let finalUrl = popupUrl;
          if (!popupUrl.includes('://')) {
            if (popupUrl.startsWith('/')) {
              finalUrl = baseUrl + popupUrl;
            } else if (!popupUrl.startsWith('#') && !popupUrl.startsWith('javascript:')) {
              finalUrl = baseUrl + '/' + popupUrl;
            }
          }
          
          console.log('Received popup request via postMessage:', popupUrl, '-> Opening:', finalUrl);
          openWindow('internet-explorer', 'Internet Explorer - Controls', 'internet-explorer', finalUrl);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const iframe = iframeRef.current;
    if (iframe) {
      const tryInject = () => {
        try {
          if (iframe.contentWindow && iframe.contentDocument) {
            const script = iframe.contentDocument.createElement('script');
            script.textContent = `
              (function() {
                const originalOpen = window.open;
                window.open = function(url, target, features) {
                  const urlString = url || '';
                  console.log('Iframe window.open called:', urlString);
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                      type: 'IE_POPUP_REQUEST',
                      url: urlString
                    }, '*');
                  }
                  return null;
                };
              })();
            `;
            iframe.contentDocument.head.appendChild(script);
          }
        } catch (e) {
          // Cross-origin restriction - expected
        }
      };

      iframe.addEventListener('load', tryInject);
      setTimeout(tryInject, 1000);
    }

    return () => {
      if (window.open === interceptedOpen) {
        window.open = originalOpen;
      }
      window.removeEventListener('message', handleMessage);
    };
  }, [openWindow, url, isLocalVideo]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)',
        color: '#ffffff',
      }}
    >
      {/* Title Bar */}
      <div
        style={{
          padding: '12px',
          background: '#1a1a1a',
          borderBottom: '1px solid #000000',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          {displayUrl || 'No video loaded'}
        </div>
        <div style={{ fontSize: '10px', color: '#888888' }}>
          {isLocalVideo ? 'Local Video' : 'Web Content'}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Video/Content Display */}
        <div style={{ flex: 1, minHeight: '200px', background: '#000000', position: 'relative', overflow: 'hidden' }}>
          {isLocalVideo ? (
            <video
              ref={videoRef}
              src={videoPath}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : url ? (
            <iframe
              ref={iframeRef}
              src={url}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block'
              }}
              title="Internet Explorer"
              allow="camera; microphone; geolocation"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox"
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#888888',
              fontSize: '14px'
            }}>
              No content loaded
            </div>
          )}
        </div>

        {isLocalVideo && (
          <>
            {/* Seek Bar */}
            <div style={{ padding: '8px', background: '#1a1a1a' }}>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px', color: '#888888' }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ 
              padding: '8px', 
              background: '#1a1a1a', 
              borderTop: '1px solid #000000',
              display: 'flex',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <button
                className="win-button"
                onClick={togglePlay}
                style={{ fontSize: '12px', padding: '4px 12px' }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                className="win-button"
                onClick={() => {
                  const video = videoRef.current;
                  if (video) {
                    video.pause();
                    video.currentTime = 0;
                    setIsPlaying(false);
                  }
                }}
                style={{ fontSize: '12px', padding: '4px 12px' }}
              >
                ⏹
              </button>
            </div>

            {/* Volume Control */}
            <div style={{ 
              padding: '8px', 
              background: '#1a1a1a', 
              borderTop: '1px solid #000000', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <button
                className="win-button"
                onClick={() => setIsMuted(!isMuted)}
                style={{ fontSize: '12px', padding: '2px 6px' }}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '10px', minWidth: '40px', textAlign: 'right' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          </>
        )}

        {!isLocalVideo && url && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            backgroundColor: '#1a1a1a',
            borderTop: '1px solid #000000',
            gap: '8px'
          }}>
            <button
              className="win-button"
              onClick={() => window.open(url, '_blank')}
              style={{ fontSize: '10px', padding: '4px 8px' }}
            >
              Open in New Tab
            </button>
            <button
              className="win-button"
              onClick={handleOpenControls}
              style={{ fontSize: '10px', padding: '4px 8px' }}
            >
              Controls
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
