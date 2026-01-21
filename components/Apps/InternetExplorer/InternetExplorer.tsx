'use client';

import React, { useEffect, useRef } from 'react';
import { useWindowStore } from '@/stores/windowStore';

interface InternetExplorerProps {
  url?: string;
}

// Convert YouTube watch URL to embed URL format
const convertYouTubeUrlToEmbed = (url: string): string => {
  // Check if it's already an embed URL
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  let videoId: string | null = null;
  
  // Extract video ID from youtu.be short URL
  const youtuBeMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (youtuBeMatch) {
    videoId = youtuBeMatch[1];
  }
  
  // Extract video ID from watch URL if not found yet
  if (!videoId) {
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
  }
  
  if (videoId) {
    // Extract list parameter if present
    const listMatch = url.match(/[?&]list=([^&]+)/);
    const listParam = listMatch ? `&list=${listMatch[1]}` : '';
    // Extract start_radio parameter if present
    const radioMatch = url.match(/[?&]start_radio=([^&]+)/);
    const radioParam = radioMatch ? `&start_radio=${radioMatch[1]}` : '';
    
    return `https://www.youtube.com/embed/${videoId}${listParam || radioParam ? '?' : ''}${listParam}${radioParam}`.replace(/\?&/, '?').replace(/\?$/, '');
  }
  
  // If it's not a YouTube URL or can't be converted, return as-is
  return url;
};

export const InternetExplorer: React.FC<InternetExplorerProps> = ({ 
    url = 'https://www.youtube.com/watch?v=LXOr65OZ-Ac'
}) => {
  // Convert YouTube URL to embed format if needed
  const embedUrl = convertYouTubeUrlToEmbed(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const openWindow = useWindowStore((state) => state.openWindow);
  const componentIdRef = useRef<string>(`ie-${Date.now()}-${Math.random()}`);

  // Handle opening controls window manually
  const handleOpenControls = () => {
    // Use production URL for controls
    const baseUrl = url.replace(/\/$/, '');
    const controlsUrl = baseUrl + '/controls.html';
    
    openWindow('internet-explorer', 'Internet Explorer - Controls', 'internet-explorer', controlsUrl);
  };

  useEffect(() => {
    // Store original window.open
    const originalOpen = window.open;
    const componentId = componentIdRef.current;
    const baseUrl = embedUrl.replace(/\/$/, ''); // Remove trailing slash

    // Override window.open to intercept popup requests
    // This will catch popups that escape the sandbox or are called from the parent context
    const interceptedOpen = function(popupUrl?: string | URL, target?: string, features?: string) {
      // Extract the URL string
      let urlString = '';
      if (popupUrl) {
        urlString = typeof popupUrl === 'string' ? popupUrl : popupUrl.toString();
      }
      
      // Handle empty or undefined URLs - don't intercept these
      if (!urlString || urlString.trim() === '') {
        return originalOpen.call(window, popupUrl, target, features);
      }
      
      // Handle relative URLs - convert to absolute
      if (urlString.startsWith('/')) {
        urlString = baseUrl + urlString;
      } else if (!urlString.includes('://') && !urlString.startsWith('#') && !urlString.startsWith('javascript:') && !urlString.startsWith('about:')) {
        // Relative path without leading slash
        urlString = baseUrl + '/' + urlString;
      }
      
      // Ensure we have the full absolute URL
      let finalUrl = urlString;
      if (!finalUrl.includes('://')) {
        // If it's still relative, make it absolute
        if (finalUrl.startsWith('/')) {
          finalUrl = baseUrl + finalUrl;
        } else if (finalUrl) {
          finalUrl = baseUrl + '/' + finalUrl;
        }
      }
      
      // Skip if it's the same as the main URL
      if (finalUrl === baseUrl || finalUrl === baseUrl + '/' || finalUrl === url || finalUrl === embedUrl) {
        return originalOpen.call(window, popupUrl, target, features);
      }
      
      // Check if this is a popup from our iframe domain (especially controls.html)
      const isControlsPopup = finalUrl.includes('controls.html') || finalUrl.endsWith('/controls');
      const isOurDomain = finalUrl.includes('camera-effects.vercel.app') || 
                         (finalUrl.startsWith(baseUrl) && finalUrl !== baseUrl && finalUrl !== baseUrl + '/');
      
      if (isControlsPopup || isOurDomain) {
        // Open in our window system as a full window (not a popup)
        console.log('Intercepting popup:', urlString, '-> Opening full window:', finalUrl);
        openWindow('internet-explorer', 'Internet Explorer - Controls', 'internet-explorer', finalUrl);
        // Return a mock window object to prevent the browser popup
        return {
          closed: false,
          close: () => {},
          focus: () => {},
          blur: () => {},
          postMessage: () => {},
        } as Window;
      }

      // For other URLs, use original behavior
      return originalOpen.call(window, popupUrl, target, features);
    };

    // Override window.open
    window.open = interceptedOpen;

    // Handle popup windows via postMessage
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from any origin (since we're loading external content)
      if (event.data && event.data.type === 'IE_POPUP_REQUEST') {
        let popupUrl = event.data.url;
        if (popupUrl) {
          // The camera-effects app now sends the full absolute URL, but handle relative URLs as fallback
          let finalUrl = popupUrl;
          if (!popupUrl.includes('://')) {
            // Handle relative URLs - convert to absolute using the base URL
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

    // Monitor for popup windows by checking if new windows open
    // Since we can't intercept cross-origin window.open calls directly,
    // we'll use a combination of approaches
    
    // Track opened windows to detect popups
    let openedWindows: Window[] = [];
    const checkForNewWindows = setInterval(() => {
      // This is a fallback - the main interception should work
    }, 1000);

    // Try to inject a script into the iframe to intercept window.open
    // This only works for same-origin iframes, but we'll try anyway
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
                  // Send message to parent to open popup in our window system
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                      type: 'IE_POPUP_REQUEST',
                      url: urlString
                    }, '*');
                  }
                  // Return null to prevent the popup (we'll handle it ourselves)
                  return null;
                };
              })();
            `;
            iframe.contentDocument.head.appendChild(script);
          }
        } catch (e) {
          // Cross-origin restriction - that's expected
          // We'll rely on the global window.open override and manual button
        }
      };

      // Try after iframe loads
      iframe.addEventListener('load', tryInject);
      // Also try after a short delay in case the iframe loads asynchronously
      setTimeout(tryInject, 1000);
    }

    return () => {
      // Restore original window.open
      if (window.open === interceptedOpen) {
        window.open = originalOpen;
      }
      window.removeEventListener('message', handleMessage);
      if (checkForNewWindows) {
        clearInterval(checkForNewWindows);
      }
    };
  }, [openWindow, embedUrl]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#c0c0c0',
      border: '2px inset #c0c0c0'
    }}>
      {/* Address Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
        backgroundColor: '#c0c0c0',
        borderBottom: '1px solid #808080',
        gap: '4px'
      }}>
        <span style={{ fontSize: '11px', fontFamily: 'MS Sans Serif', marginRight: '4px' }}>
          Address:
        </span>
        <input
          type="text"
          value={url}
          readOnly
          style={{
            flex: 1,
            padding: '2px 4px',
            border: '2px inset #c0c0c0',
            backgroundColor: '#ffffff',
            fontFamily: 'MS Sans Serif',
            fontSize: '11px',
            outline: 'none'
          }}
        />
        <button
          style={{
            padding: '2px 8px',
            border: '2px outset #c0c0c0',
            backgroundColor: '#c0c0c0',
            fontFamily: 'MS Sans Serif',
            fontSize: '11px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
          onClick={() => window.open(url, '_blank')}
        >
          Go
        </button>
        <button
          style={{
            padding: '2px 8px',
            border: '2px outset #c0c0c0',
            backgroundColor: '#c0c0c0',
            fontFamily: 'MS Sans Serif',
            fontSize: '11px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
          onClick={handleOpenControls}
          title="Open Controls Window"
        >
          Controls
        </button>
        <button
          style={{
            padding: '2px 8px',
            border: '2px outset #c0c0c0',
            backgroundColor: '#c0c0c0',
            fontFamily: 'MS Sans Serif',
            fontSize: '11px',
            cursor: 'pointer'
          }}
          onClick={() => {
            // Open the original YouTube watch URL in a new tab to see comments
            window.open(url, '_blank');
          }}
          title="Open in YouTube (to see comments)"
        >
          View on YouTube
        </button>
      </div>

      {/* Browser Content */}
      <div style={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#ffffff'
      }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
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
      </div>
    </div>
  );
};

