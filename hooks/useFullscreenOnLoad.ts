'use client';

import { useEffect, useRef } from 'react';

/**
 * Request fullscreen on the document element.
 * Uses standard and vendor-prefixed APIs for broad support.
 */
export function requestFullscreen(): void {
  const el = document.documentElement;
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if ((el as HTMLDocument & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
    (el as HTMLDocument & { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
  } else if ((el as HTMLDocument & { msRequestFullscreen?: () => void }).msRequestFullscreen) {
    (el as HTMLDocument & { msRequestFullscreen: () => void }).msRequestFullscreen();
  }
}

/**
 * Try to enter fullscreen on load. Because most browsers require a user gesture,
 * this also enters fullscreen on the first click/tap if the initial attempt fails.
 */
export function useFullscreenOnLoad(enabled = true): void {
  const triedOnLoad = useRef(false);
  const triedOnClick = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const tryFullscreen = () => {
      requestFullscreen();
    };

    // Try once on load (may work in some contexts, e.g. PWA or kiosk)
    if (!triedOnLoad.current) {
      triedOnLoad.current = true;
      tryFullscreen();
    }

    const onFirstInteraction = () => {
      if (triedOnClick.current) return;
      const isFullscreen = document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      if (isFullscreen) return;
      triedOnClick.current = true;
      tryFullscreen();
    };

    document.addEventListener('click', onFirstInteraction, { once: true });
    document.addEventListener('keydown', onFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', onFirstInteraction);
      document.removeEventListener('keydown', onFirstInteraction);
    };
  }, [enabled]);
}
