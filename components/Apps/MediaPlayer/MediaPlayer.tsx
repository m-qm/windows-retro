'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { Visualizer } from './Visualizer';
import { Controls } from './Controls';
import { Playlist } from './Playlist';
import { VisualizerMode } from '@/hooks/useAudioVisualizer';
import { ParameterController } from '@/hooks/useHydraParameterController';

// Declare global Hydra types
declare global {
  interface Window {
    Hydra?: any;
    src?: any;
    osc?: any;
    noise?: any;
    gradient?: any;
    time?: number;
    s0?: any;
    s1?: any;
    o0?: any;
    o1?: any;
  }
}

export const MediaPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaVideoRef = useRef<HTMLVideoElement>(null); // For video file playback
  const videoRefS1 = useRef<HTMLVideoElement | null>(null); // Second video element for s1 camera
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hydraRef = useRef<any>(null);
  const paramsRef = useRef<ParameterController | null>(null);
  const effectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streamRefS1 = useRef<MediaStream | null>(null); // Second camera stream for s1
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('battery');
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const mediaPlayerState = useWindowStore((state) => state.mediaPlayerState);
  const {
    togglePlay,
    setCurrentTrack,
    nextTrack,
    previousTrack,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    toggleMute,
  } = useWindowStore();

  const { currentTrack, isPlaying, volume, isMuted, isShuffled, isRepeating, playlist } = mediaPlayerState;
  
  
  // Safely get current track data with validation
  const currentTrackData = useMemo(() => {
    const track = playlist[currentTrack];
    if (!track) return null;
    
    // Validate that URL is a string and not an object/video element
    if (track.url && typeof track.url !== 'string') {
      console.error('Invalid track URL type detected:', typeof track.url, track);
      // Return a safe copy with empty URL to prevent errors
      return { ...track, url: '' };
    }
    
    // Additional check: ensure URL doesn't contain object references
    if (typeof track.url === 'string' && (track.url.includes('[object') || track.url.includes('HTMLVideoElement'))) {
      console.error('Track URL contains object reference:', track.url);
      return { ...track, url: '' };
    }
    
    return track;
  }, [playlist, currentTrack]);
  
  // Determine track type - memoized to prevent infinite loops
  const trackType = useMemo(() => {
    if (!currentTrackData) return 'visualizer';
    
    const title = String(currentTrackData.title || '');
    
    // Safely get URL - ensure it's always a string and never an object
    let url = '';
    if (typeof currentTrackData.url === 'string') {
      url = currentTrackData.url;
    } else {
      // If it's not a string, don't use it - this prevents video elements from being used
      console.warn('Track URL is not a string, skipping URL-based detection:', typeof currentTrackData.url);
      url = '';
    }
    
    // Track 1: ASAP Rocky - Camera with surrealGlitch effects
    if (title.includes('A$AP Rocky') || title.includes('Wassup') || (url && url.includes('Wassup'))) {
      return 'camera-surreal-glitch';
    }
    // Track 2: I Smoked Away My Brain - Camera with NO effects (raw feed)
    if (title.includes('I Smoked Away My Brain') || (url && url.includes('I Smoked Away My Brain'))) {
      return 'camera-no-effects';
    }
    // Track 3: A1 Traca - Camera with warm reflective effects
    if (title.includes('Visages') || title.includes('The Hidden Valley') || (url && url.includes('Visajes The Hidden Valley.mp3'))) {
      return 'camera-warm-reflective';
    }
    // Video file
    if (url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm'))) {
      return 'video';
    }
    // Others: Regular visualizer
    return 'visualizer';
  }, [currentTrack, currentTrackData?.id]);
  
  const isASAPRockyTrack = trackType === 'camera-surreal-glitch';
  const isCameraNoEffectsTrack = trackType === 'camera-no-effects';
  const isWarmReflectiveTrack = trackType === 'camera-warm-reflective';
  const isVideoTrack = trackType === 'video';
  const showCamera = isASAPRockyTrack || isCameraNoEffectsTrack || isWarmReflectiveTrack;

  useEffect(() => {
    const audio = audioRef.current;
    const mediaVideo = mediaVideoRef.current;

    const updateTimeAudio = () => setCurrentTime(audio?.currentTime || 0);
    const updateDurationAudio = () => setDuration(audio?.duration || 0);
    const updateTimeVideo = () => setCurrentTime(mediaVideo?.currentTime || 0);
    const updateDurationVideo = () => setDuration(mediaVideo?.duration || 0);
    const handleEnded = () => {
      if (isRepeating) {
        if (isVideoTrack && mediaVideo) {
          mediaVideo.currentTime = 0;
          mediaVideo.play();
        } else if (audio) {
          audio.currentTime = 0;
          audio.play();
        }
      } else {
        useWindowStore.getState().nextTrack();
      }
    };

    if (audio) {
      audio.addEventListener('timeupdate', updateTimeAudio);
      audio.addEventListener('loadedmetadata', updateDurationAudio);
      audio.addEventListener('ended', handleEnded);
    }
    
    if (mediaVideo) {
      mediaVideo.addEventListener('timeupdate', updateTimeVideo);
      mediaVideo.addEventListener('loadedmetadata', updateDurationVideo);
      mediaVideo.addEventListener('ended', handleEnded);
    }

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', updateTimeAudio);
        audio.removeEventListener('loadedmetadata', updateDurationAudio);
        audio.removeEventListener('ended', handleEnded);
      }
      if (mediaVideo) {
        mediaVideo.removeEventListener('timeupdate', updateTimeVideo);
        mediaVideo.removeEventListener('loadedmetadata', updateDurationVideo);
        mediaVideo.removeEventListener('ended', handleEnded);
      }
    };
  }, [isRepeating, isVideoTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    const mediaVideo = mediaVideoRef.current;

    if (audio) audio.volume = isMuted ? 0 : volume;
    if (mediaVideo) mediaVideo.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    const mediaVideo = mediaVideoRef.current;
    
    // Get fresh track data from playlist to avoid stale references
    const track = playlist[currentTrack];
    if (!track || !track.url) {
      console.warn('No track or track URL found for index:', currentTrack);
      return;
    }

    // Ensure url is a string, not an object or video element
    let trackUrl: string = '';
    
    // Strict type checking
    if (typeof track.url !== 'string') {
      console.error('Track URL is not a string:', track.url, typeof track.url, track);
      return;
    }
    
    trackUrl = track.url.trim();
    
    if (!trackUrl || trackUrl.length === 0) {
      console.error('Track URL is empty');
      return;
    }
    
    // Additional safety checks - reject any non-string values
    if (trackUrl.includes('[object') || 
        trackUrl.includes('HTMLVideoElement') || 
        trackUrl.includes('HTMLAudioElement') ||
        trackUrl.startsWith('object')) {
      console.error('Invalid track URL detected (contains object reference):', trackUrl);
      return;
    }
    
    // Ensure it's a valid path (starts with /)
    if (!trackUrl.startsWith('/')) {
      console.error('Track URL does not start with /:', trackUrl);
      return;
    }

    // Check if this is a video file
    const isVideo = trackUrl.includes('.mp4') || trackUrl.includes('.mov') || trackUrl.includes('.webm');
    
    if (isVideo && mediaVideo) {
      // Set video source
      try {
        const currentSrc = mediaVideo.src ? new URL(mediaVideo.src).pathname : '';
        if (currentSrc !== trackUrl) {
          mediaVideo.src = trackUrl;
          mediaVideo.load();
        }
      } catch (error) {
        console.error('Error setting video source:', error, trackUrl);
      }
      // Pause audio if it was playing
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    } else if (audio) {
      // Set audio source
      try {
        const currentSrc = audio.src ? new URL(audio.src).pathname : '';
        if (currentSrc !== trackUrl) {
          audio.src = '';
          audio.src = trackUrl;
          audio.load();
        }
      } catch (error) {
        console.error('Error setting audio source:', error, trackUrl);
        return;
      }
      // Pause video if it was playing
      if (mediaVideo) {
        mediaVideo.pause();
      }
    }
    
    // Don't auto-play here - let the isPlaying useEffect handle playback
  }, [currentTrack, playlist]);

  useEffect(() => {
    const audio = audioRef.current;
    const mediaVideo = mediaVideoRef.current;
    const track = playlist[currentTrack];
    const trackUrl = track?.url || '';
    const isVideo = trackUrl.includes('.mp4') || trackUrl.includes('.mov') || trackUrl.includes('.webm');

    if (isPlaying) {
      if (isVideo && mediaVideo) {
        // Play video
        if (!mediaVideo.src || new URL(mediaVideo.src).pathname !== trackUrl) {
          mediaVideo.src = trackUrl;
          mediaVideo.load();
        }
        mediaVideo.play().catch(console.error);
        // Pause audio
        if (audio) audio.pause();
      } else if (audio) {
        // Play audio
        if (!audio.src || audio.src === window.location.href) {
          if (track && typeof track.url === 'string') {
            audio.src = track.url;
            audio.load();
          }
        }
        audio.play().catch(console.error);
        // Pause video
        if (mediaVideo) mediaVideo.pause();
      }
    } else {
      if (audio) audio.pause();
      if (mediaVideo) mediaVideo.pause();
    }
  }, [isPlaying, currentTrack, playlist]);

  // Initialize cameras when camera tracks are selected
  useEffect(() => {
    if (!showCamera) {
      // Cleanup cameras if switching away from camera tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (streamRefS1.current) {
        streamRefS1.current.getTracks().forEach(track => track.stop());
        streamRefS1.current = null;
      }
      if (videoRefS1.current) {
        videoRefS1.current = null;
      }
      setCameraReady(false);
      return;
    }

    const initCameras = async () => {
      const video = videoRef.current;
      if (!video) {
        console.log('Video element not ready yet');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Camera API not available. Please use HTTPS or localhost.';
        console.error(errorMsg);
        setCameraError(errorMsg);
        return;
      }

      try {
        console.log('Requesting camera access for s0 (front camera)...');
        
        // Initialize s0 with front camera (facingMode: 'user') - maximum resolution for hyper realistic quality
        const streamS0 = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          },
          audio: false,
        });

        console.log('Camera stream s0 obtained:', streamS0);
        streamRef.current = streamS0;
        
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = streamS0;
        
        // Try to get a second camera for s1 (back camera or another device)
        try {
          console.log('Requesting camera access for s1 (back camera)...');
          
          // Create a hidden video element for s1 camera
          const videoS1 = document.createElement('video');
          videoS1.autoplay = true;
          videoS1.playsInline = true;
          videoS1.muted = true;
          videoS1.style.display = 'none';
          document.body.appendChild(videoS1);
          videoRefS1.current = videoS1;
          
          // Try to get back camera (facingMode: 'environment') - maximum resolution for hyper realistic quality
          const streamS1 = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment', // Back camera
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
            },
            audio: false,
          });

          console.log('Camera stream s1 obtained:', streamS1);
          streamRefS1.current = streamS1;
          videoS1.srcObject = streamS1;
          videoS1.play().catch(console.error);
        } catch (s1Error: any) {
          console.warn('Could not access second camera (s1), will use same camera:', s1Error);
          // If back camera fails, try to enumerate devices and get a different one
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            console.log('Available video devices:', videoDevices);
            
            if (videoDevices.length > 1) {
              // Try to get a different device by deviceId
              const secondDevice = videoDevices.find(device => 
                device.deviceId !== streamS0.getVideoTracks()[0].getSettings().deviceId
              );
              
              if (secondDevice) {
                const videoS1 = document.createElement('video');
                videoS1.autoplay = true;
                videoS1.playsInline = true;
                videoS1.muted = true;
                videoS1.style.display = 'none';
                document.body.appendChild(videoS1);
                videoRefS1.current = videoS1;
                
                const streamS1 = await navigator.mediaDevices.getUserMedia({
                  video: {
                    deviceId: { exact: secondDevice.deviceId },
                    width: { ideal: 1920, min: 1280 },
                    height: { ideal: 1080, min: 720 },
                  },
                  audio: false,
                });
                
                console.log('Camera stream s1 obtained from alternate device:', streamS1);
                streamRefS1.current = streamS1;
                videoS1.srcObject = streamS1;
                videoS1.play().catch(console.error);
              }
            }
          } catch (enumError) {
            console.warn('Could not enumerate devices:', enumError);
          }
        }
        
        setCameraError(null);

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Camera initialization timeout'));
          }, 10000);

          const checkReady = () => {
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
              clearTimeout(timeout);
              console.log('Video ready:', video.videoWidth, 'x', video.videoHeight);
              video.play()
                .then(() => {
                  console.log('Video playing');
                  setCameraReady(true);
                  resolve();
                })
                .catch((err) => {
                  console.error('Error playing video:', err);
                  setCameraReady(true);
                  resolve();
                });
            } else {
              setTimeout(checkReady, 50);
            }
          };
          
          video.addEventListener('loadedmetadata', checkReady, { once: true });
          video.addEventListener('loadeddata', checkReady, { once: true });
          checkReady();
        });
      } catch (error: any) {
        console.error('Error accessing camera:', error);
        let errorMsg = 'Failed to access camera';
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMsg = 'Camera permission denied. Please allow camera access.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMsg = 'No camera found. Please connect a camera.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMsg = 'Camera is already in use by another application.';
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        setCameraError(errorMsg);
        setCameraReady(false);
      }
    };

    const timer = setTimeout(() => {
      initCameras();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (streamRefS1.current) {
        streamRefS1.current.getTracks().forEach(track => track.stop());
        streamRefS1.current = null;
      }
      if (videoRefS1.current) {
        videoRefS1.current.srcObject = null;
        if (videoRefS1.current.parentElement) {
          videoRefS1.current.parentElement.removeChild(videoRefS1.current);
        }
        videoRefS1.current = null;
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      setCameraReady(false);
    };
  }, [showCamera]);

  // Apply warm reflective effect (for track 3)
  const applyWarmReflective = useCallback(() => {
    if (!paramsRef.current || !window.s0) return;

    const params = paramsRef.current;
    const currentTime = window.time ?? 0;
    const warmth = params.get('warmth');
    const reflection = params.get('reflection');
    const texture = params.get('texture');
    const glow = params.get('glow');
    const layerBlend = params.get('layerBlend');
    const distortion = params.get('distortion');
    const sourceToggle = Math.round(params.get('sourceToggle')); // 0 = s0, 1 = s1
    
    // Get the active source based on toggle
    // s0 = front camera, s1 = back/alternate camera
    const useS1 = sourceToggle === 1 && window.s1;
    
    // Nested reflection effect:
    // 1. Outer reflection: inverted, full screen (background)
    // 2. Inner reflection: inverted, smaller, centered (contained within outer)
    // 3. Combine them with the outer as base
    
    // Create completely blue effect - similar to how first effect is completely purple
    // Completely inverted (180° rotation), full screen - floor on top
    const outerSource = useS1 ? window.s1 : window.s0;
    window.src(outerSource)
      .scale(-1, -1) // Invert both axes (180° rotation) - floor on top
      .color(0.2, 0.3, 1.0) // Completely blue - strong blue channel, minimal red/green
      .saturate(2.0) // High saturation for vibrant blue
      .contrast(2.0) // Increased contrast for darker, more dramatic effect
      .brightness(0.5) // Reduced brightness for darker look
      .out(window.o0);
  }, []);

  // Apply surrealGlitch effect - memoized to prevent recreation
  const applySurrealGlitch = useCallback(() => {
    if (!paramsRef.current || !window.s0) return;

    const params = paramsRef.current;
    const pinkSplash = params.get('pinkSplash');
    const pixelation = params.get('pixelation');
    const blockyArtifacts = params.get('blockyArtifacts');
    const glitchDist = params.get('glitchDistortion');
    const goldTint = params.get('goldTint');
    const sourceToggle = Math.round(params.get('sourceToggle')); // 0 = s0, 1 = s1
    
    // Get the active source based on toggle
    // s0 = front camera, s1 = back/alternate camera
    const useS1 = sourceToggle === 1 && window.s1;
    const activeSource = useS1 ? window.s1 : window.s0;
    
    const pixelScale = 0.05 + (1 - pixelation) * 0.25;
    
    window.src(activeSource)
      .scale(pixelScale, pixelScale)
      .scale(1 / pixelScale, 1 / pixelScale)
      .thresh(0.5)
      .contrast(params.get('contrast') * 1.5)
      .saturate(params.get('saturation') * 1.3)
      .out(window.o1);
    
    const pinkMask = window.noise(0.3)
      .thresh(0.3 + pinkSplash * 0.4)
      .scale(0.1, 0.1)
      .scale(10, 10)
      .thresh(0.5);
    
    const pinkOverlay = window.src(activeSource)
      .color(1, 0.2, 0.8)
      .saturate(3)
      .brightness(0.5)
      .thresh(0.4)
      .mask(pinkMask);
    
    const currentTime = window.time ?? 0;
    const blockyNoise = window.noise(0.2)
      .thresh(0.4 + blockyArtifacts * 0.4)
      .scale(0.03 + blockyArtifacts * 0.12, 0.03 + blockyArtifacts * 0.12)
      .scale(1 / (0.03 + blockyArtifacts * 0.12), 1 / (0.03 + blockyArtifacts * 0.12))
      .thresh(0.5)
      .scrollY(currentTime * 0.2)
      .scrollX(currentTime * 0.15);
    
    const glitchLines = window.noise(100)
      .thresh(0.95)
      .scale(0.01, 0.01)
      .scale(100, 100)
      .thresh(0.9)
      .scrollY(currentTime * 1.5);
    
    const framePersistence = 0.85 + (1 - goldTint) * 0.1;
    
    const squareDistort = window.noise(0.5)
      .thresh(0.7)
      .scale(0.05, 0.05)
      .scale(20, 20)
      .thresh(0.8);
    
    window.src(window.o1)
      .layer(pinkOverlay, pinkSplash)
      .modulate(blockyNoise, blockyArtifacts * 0.4)
      .modulate(glitchLines, glitchDist * 0.15)
      .modulate(squareDistort.scrollY(currentTime * 1.2), glitchDist * 0.12)
      // Remove scroll to ensure full screen coverage
      // .scrollX(params.get('scrollX') * (1 + glitchDist * 2))
      // .scrollY(params.get('scrollY') * (1 + glitchDist * 2))
      .color(
        params.get('colorR') * (1 - pinkSplash * 0.3),
        params.get('colorG') * (1 - pinkSplash * 0.2),
        params.get('colorB') * (1 - pinkSplash * 0.1)
      )
      .blend(window.o0, framePersistence)
      .out(window.o0);
  }, []);

  // Initialize Hydra when camera tracks are selected and camera is ready
  // Note: We initialize Hydra even when not playing, so effects are ready when user hits play
  useEffect(() => {
    if ((!isASAPRockyTrack && !isWarmReflectiveTrack) || !cameraReady) {
      // No interval to clean up - we only apply effects once
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      return;
    }
    
    const initHydra = async () => {
      if (!canvasRef.current || !videoRef.current) {
        console.log('Canvas or video element not ready');
        return;
      }

      const video = videoRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        const waitForDimensions = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('Video has dimensions:', video.videoWidth, 'x', video.videoHeight);
            initHydra();
          } else {
            setTimeout(waitForDimensions, 100);
          }
        };
        setTimeout(waitForDimensions, 100);
        return;
      }

      try {
        console.log('Initializing Hydra for ASAP Rocky track...');
        const Hydra = (await import('hydra-synth')).default;
        
        const hydra = new Hydra({
          canvas: canvasRef.current,
          autoLoop: true,
          detectAudio: false,
          precision: 'highp',
        });

        console.log('Hydra initialized');
        hydraRef.current = hydra;
        paramsRef.current = new ParameterController();

        await new Promise(resolve => setTimeout(resolve, 200));

        const setupVideoSource = () => {
          if (!window.s0) {
            console.error('Hydra s0 not available');
            return;
          }

          if (video.readyState >= 2 && video.videoWidth > 0) {
            try {
              console.log('Setting up video source with Hydra...');
              // For video elements, use init({ src: video }) - this handles live video streams
              // Do NOT use initImage() with video elements as it expects a URL string or Image element
              window.s0.init({ src: video });
              console.log('Initialized s0 with front camera');
              
              // Initialize s1 with the second camera (back camera or alternate device)
              if (window.s1 && videoRefS1.current) {
                const videoS1 = videoRefS1.current;
                if (videoS1.readyState >= 2 && videoS1.videoWidth > 0) {
                  try {
                    window.s1.init({ src: videoS1 });
                    console.log('Initialized s1 with back/alternate camera');
                  } catch (e) {
                    console.warn('Could not initialize s1:', e);
                  }
                } else {
                  // Wait for s1 video to be ready
                  const waitForS1 = () => {
                    if (videoS1.readyState >= 2 && videoS1.videoWidth > 0) {
                      try {
                        window.s1.init({ src: videoS1 });
                        console.log('Initialized s1 with back/alternate camera (delayed)');
                      } catch (e) {
                        console.warn('Could not initialize s1:', e);
                      }
                    } else {
                      setTimeout(waitForS1, 100);
                    }
                  };
                  waitForS1();
                }
              }
              
              // Use requestAnimationFrame for better timing instead of setTimeout
              requestAnimationFrame(() => {
                try {
                  // Apply the correct effect based on track type
                  if (isASAPRockyTrack) {
                    applySurrealGlitch();
                  } else if (isWarmReflectiveTrack) {
                    applyWarmReflective();
                  }
                } catch (error) {
                  console.error('Error applying effects:', error);
                }
              });
            } catch (error) {
              console.error('Error initializing camera source:', error);
            }
          }
        };

        setupVideoSource();

        // For live video streams with init({ src: video }), Hydra automatically
        // handles frame updates. We don't need to continuously call initImage()
        // which was causing the error (initImage expects URL string or Image, not Video element).
        // The update interval is removed as it's not needed and was causing the error.

        // Apply effects - Hydra's autoLoop handles continuous rendering
        // We only need to set up the effect chain once, Hydra will handle the rest
        // Apply the correct effect based on track type
        try {
          if (isASAPRockyTrack) {
            applySurrealGlitch();
            console.log('SurrealGlitch effect applied');
          } else if (isWarmReflectiveTrack) {
            applyWarmReflective();
            console.log('WarmReflective effect applied');
          }
        } catch (error) {
          console.error('Error applying initial effects:', error);
        }
        
        // No need for continuous reapplication - Hydra's autoLoop handles rendering
        // The effect chain is set up once and Hydra continuously renders it

        return () => {
          if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
          }
          // No interval to clean up - we only apply effects once
        };
      } catch (error) {
        console.error('Error initializing Hydra:', error);
        setCameraError('Failed to initialize video effects');
      }
    };

    const timer = setTimeout(() => {
      initHydra();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      // No interval to clean up - we only apply effects once
    };
  }, [isASAPRockyTrack, isWarmReflectiveTrack, cameraReady, applySurrealGlitch, applyWarmReflective]);

  // Keyboard shortcut to toggle between s0 and s1
  useEffect(() => {
    if (!paramsRef.current) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'S' key to toggle between s0 and s1
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault(); // Prevent default behavior
        const currentToggle = paramsRef.current?.get('sourceToggle') || 0;
        const newToggle = currentToggle === 0 ? 1 : 0;
        paramsRef.current?.set('sourceToggle', newToggle);
        
        // Clear the output first to force reapplication
        if (window.o0) {
          try {
            // Reapply the current effect with the new source
            if (isASAPRockyTrack) {
              applySurrealGlitch();
            } else if (isWarmReflectiveTrack) {
              applyWarmReflective();
            }
            console.log(`Switched to source: ${newToggle === 0 ? 's0 (front camera)' : 's1 (back/alternate camera)'}`);
          } catch (error) {
            console.error('Error reapplying effect:', error);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isASAPRockyTrack, isWarmReflectiveTrack, applySurrealGlitch, applyWarmReflective]);

  // Sync canvas size with video dimensions
  useEffect(() => {
    if (!showCamera) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const updateCanvasSize = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        // For hyper realistic quality, use actual video resolution for canvas
        // This ensures no downscaling and maximum sharpness
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Set CSS size to fill container while maintaining aspect ratio
        const container = canvas.parentElement;
        if (container) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          const videoAspect = video.videoWidth / video.videoHeight;
          const containerAspect = containerWidth / containerHeight;
          
          if (containerAspect > videoAspect) {
            // Container is wider - fit to height
            canvas.style.width = 'auto';
            canvas.style.height = '100%';
          } else {
            // Container is taller - fit to width
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
          }
        }
      }
    };

    video.addEventListener('loadedmetadata', updateCanvasSize);
    video.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize);
      video.removeEventListener('resize', updateCanvasSize);
    };
  }, [showCamera]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    
    if (isVideoTrack) {
      const mediaVideo = mediaVideoRef.current;
      if (mediaVideo) {
        mediaVideo.currentTime = newTime;
      }
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = newTime;
      }
    }
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
      {/* Now Playing Section */}
      <div
        style={{
          padding: '12px',
          background: '#1a1a1a',
          borderBottom: '1px solid #000000',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          {currentTrackData?.title || 'No track selected'}
        </div>
        <div style={{ fontSize: '10px', color: '#888888' }}>
          {currentTrackData?.artist || 'Unknown Artist'}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Visualizer and Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Visualizer or Camera */}
          <div style={{ flex: 1, minHeight: '150px', background: '#000000', position: 'relative', overflow: 'hidden' }}>
            {/* Always render video and canvas elements so refs are available on first load */}
            {/* Video element for camera feed - always in DOM */}
            <video
              ref={videoRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: showCamera && isCameraNoEffectsTrack ? '100%' : 0,
                height: showCamera && isCameraNoEffectsTrack ? '100%' : 0,
                maxWidth: '100%',
                maxHeight: '100%',
                opacity: showCamera && isCameraNoEffectsTrack ? 1 : 0,
                pointerEvents: 'none',
                objectFit: 'contain',
                zIndex: 1,
              }}
              controls={false}
              playsInline
              muted
              autoPlay
            />
            {/* Canvas element for Hydra effects - always in DOM */}
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: showCamera && !isCameraNoEffectsTrack && !cameraError ? '100%' : 0,
                height: showCamera && !isCameraNoEffectsTrack && !cameraError ? '100%' : 0,
                opacity: showCamera && !isCameraNoEffectsTrack && !cameraError ? 1 : 0,
                objectFit: 'cover',
                zIndex: 1,
              }}
            />
            {/* Video element for media video playback */}
            <video
              ref={mediaVideoRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: isVideoTrack ? '100%' : 0,
                height: isVideoTrack ? '100%' : 0,
                opacity: isVideoTrack ? 1 : 0,
                objectFit: 'contain',
                zIndex: 2,
              }}
              controls={false}
              playsInline
              autoPlay
            />
            {isVideoTrack ? (
              // Video file playback
              <div style={{ height: '100%', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Video is rendered above */}
              </div>
            ) : showCamera ? (
              // Camera feed (with or without effects depending on track)
              <>
                {cameraError ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#ffffff', height: '100%' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                    <div style={{ fontSize: '10px', color: '#cccccc' }}>{cameraError}</div>
                  </div>
                ) : (
                  // Container for positioning - video and canvas are rendered above
                  <div style={{ height: '100%', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Video and canvas are rendered above, outside conditionals */}
                  </div>
                )}
              </>
            ) : (
              // Regular visualizer for other tracks
              <>
                <div style={{ padding: '4px', background: '#1a1a1a', borderBottom: '1px solid #000000', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#cccccc' }}>Mode:</span>
                    <select
                      className="win-input"
                      value={visualizerMode}
                      onChange={(e) => setVisualizerMode(e.target.value as VisualizerMode)}
                      style={{ fontSize: '10px', padding: '2px', minWidth: '110px' }}
                    >
                      <option value="battery">Battery (Classic)</option>
                      <option value="bars">Spectrum Bars</option>
                      <option value="waveform">Waveform</option>
                      <option value="scope">Scope</option>
                    </select>
                  </div>
                  <button
                    className="win-button"
                    onClick={() => setVisualizerEnabled(!visualizerEnabled)}
                    style={{ fontSize: '10px', padding: '2px 6px' }}
                  >
                    {visualizerEnabled ? 'Hide' : 'Show'}
                  </button>
                </div>
                {visualizerEnabled && (
                  <div style={{ height: 'calc(100% - 30px)', width: '100%' }}>
                    <Visualizer
                      audioElement={showCamera ? null : audioRef.current}
                      enabled={visualizerEnabled && isPlaying && !showCamera}
                      mode={visualizerMode}
                      width={400}
                      height={150}
                    />
                  </div>
                )}
              </>
            )}
          </div>

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
          <Controls
            isPlaying={isPlaying}
            onPlay={() => togglePlay()}
            onPause={() => togglePlay()}
            onStop={() => {
              togglePlay();
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
              }
            }}
            onPrevious={previousTrack}
            onNext={nextTrack}
            onShuffle={toggleShuffle}
            onRepeat={toggleRepeat}
            isShuffled={isShuffled}
            isRepeating={isRepeating}
          />

          {/* Volume Control */}
          <div style={{ padding: '8px', background: '#1a1a1a', borderTop: '1px solid #000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="win-button"
              onClick={toggleMute}
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
        </div>

        {/* Playlist - always visible */}
        <Playlist
          tracks={playlist}
          currentTrackIndex={currentTrack}
          onTrackSelect={(index) => {
            setCurrentTrack(index);
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
            }
          }}
        />
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="auto" />
    </div>
  );
};

