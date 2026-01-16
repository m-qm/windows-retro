'use client';

import React, { useRef, useState, useEffect } from 'react';
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

export const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hydraRef = useRef<any>(null);
  const paramsRef = useRef<ParameterController | null>(null);
  const effectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      const video = videoRef.current;
      if (!video) {
        console.log('Video element not ready yet');
        return;
      }

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Camera API not available. Please use HTTPS or localhost.';
        console.error(errorMsg);
        setCameraError(errorMsg);
        return;
      }

      try {
        console.log('Requesting camera access...');
        
        // Request front-facing camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user', // Front-facing camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        console.log('Camera stream obtained:', stream);
        streamRef.current = stream;
        
        // Set video properties before assigning stream
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = stream;
        
        setCameraError(null);

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Camera initialization timeout'));
          }, 10000); // 10 second timeout

          const checkReady = () => {
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
              clearTimeout(timeout);
              console.log('Video ready:', video.videoWidth, 'x', video.videoHeight);
              video.play()
                .then(() => {
                  console.log('Video playing');
                  setIsPlaying(true);
                  resolve();
                })
                .catch((err) => {
                  console.error('Error playing video:', err);
                  // Still resolve to continue initialization
                  setIsPlaying(true);
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
        setIsPlaying(false);
      }
    };

    // Small delay to ensure video element is mounted
    const timer = setTimeout(() => {
      initCamera();
    }, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup: stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, []);

  // Initialize Hydra and apply surrealGlitch effect
  useEffect(() => {
    if (!isPlaying || cameraError) return;
    
    const initHydra = async () => {
      if (!canvasRef.current || !videoRef.current) {
        console.log('Canvas or video element not ready');
        return;
      }

      const video = videoRef.current;
      
      // Wait for video to have dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('Waiting for video dimensions...');
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
        console.log('Initializing Hydra...');
        // Dynamically import Hydra
        const Hydra = (await import('hydra-synth')).default;
        
        // Initialize Hydra
        const hydra = new Hydra({
          canvas: canvasRef.current,
          autoLoop: true,
          detectAudio: false,
          precision: 'highp',
        });

        console.log('Hydra initialized');
        hydraRef.current = hydra;
        paramsRef.current = new ParameterController();

        // Wait a bit for Hydra to be fully ready
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
              console.log('Initialized s0 with init({ src: video })');
              
              // Start applying effects after a short delay
              requestAnimationFrame(() => {
                try {
                  applyWarmReflective(); // Use the new warm reflective effect
                } catch (error) {
                  console.error('Error applying effects:', error);
                }
              });
            } catch (error) {
              console.error('Error initializing camera source:', error);
            }
          } else {
            console.log('Video not ready yet, readyState:', video.readyState);
          }
        };

        setupVideoSource();

        // For live video streams with init({ src: video }), Hydra automatically
        // handles frame updates. We don't need to continuously call initImage()
        // which was causing the error (initImage expects URL string or Image, not Video element).
        // The update interval is removed as it's not needed and was causing the error.

        return () => {
          if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
          }
          if (effectIntervalRef.current) {
            clearInterval(effectIntervalRef.current);
          }
        };
      } catch (error) {
        console.error('Error initializing Hydra:', error);
        setCameraError('Failed to initialize video effects');
      }
    };

    // Delay Hydra initialization slightly to ensure camera is fully ready
    const timer = setTimeout(() => {
      initHydra();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      if (effectIntervalRef.current) {
        clearInterval(effectIntervalRef.current);
      }
    };
  }, [isPlaying, cameraError]);

  // Apply warm reflective effect (based on the image)
  const applyWarmReflective = () => {
    if (!paramsRef.current || !window.s0) return;

    const params = paramsRef.current;
    const currentTime = window.time ?? 0;
    const warmth = params.get('warmth');
    const reflection = params.get('reflection');
    const texture = params.get('texture');
    const glow = params.get('glow');
    const layerBlend = params.get('layerBlend');
    const distortion = params.get('distortion');
    
    // Create wood grain-like texture using noise
    const woodGrain = window.noise(0.1)
      .scrollX(currentTime * 0.01)
      .scale(1, 0.3) // Stretch horizontally for wood grain effect
      .contrast(1 + texture * 2)
      .brightness(0.3 + texture * 0.4);
    
    // Base video with warm color grading (yellows, oranges, browns)
    const warmBase = window.src(window.s0)
      .color(1, 0.7 + warmth * 0.3, 0.3 + warmth * 0.4) // Warm tones: more red/yellow, less blue
      .saturate(0.8 + warmth * 0.4)
      .contrast(1.2 + glow * 0.3)
      .brightness(0.1 + glow * 0.2);
    
    // Create reflective surface effect using modulation
    const reflectiveSurface = warmBase
      .modulate(
        window.osc(10, 0, 0.1)
          .rotate(Math.PI / 4)
          .scale(2, 2),
        reflection * 0.3
      )
      .modulate(
        window.gradient()
          .rotate(Math.sin(currentTime * 0.5) * 0.2)
          .scale(1.2, 1.2),
        reflection * 0.2
      );
    
    // Add texture overlay (wood grain effect)
    const textured = reflectiveSurface
      .layer(
        woodGrain.color(1, 0.8, 0.4), // Warm brown/orange texture
        texture * 0.3
      );
    
    // Create glow/highlight effect
    const glowing = textured
      .brightness(glow * 0.3)
      .layer(
        window.src(window.s0)
          .color(1, 0.9, 0.5) // Golden highlight
          .brightness(glow * 0.5)
          .saturate(2)
          .thresh(0.7),
        glow * 0.2
      );
    
    // Add distortion for surreal effect
    const distorted = glowing
      .modulate(
        window.noise(2)
          .scrollX(currentTime * 0.1)
          .scrollY(currentTime * 0.08),
        distortion * 0.15
      )
      .modulateRotate(
        window.osc(1, 0, 0.05)
          .rotate(Math.sin(currentTime * 0.3) * 0.1),
        distortion * 0.1
      );
    
    // Create picture-in-picture effect (smaller inset layer in bottom right)
    // Use scroll to position inset in bottom right corner
    const insetLayer = window.src(window.s0)
      .scale(0.3, 0.3) // Smaller inset
      .color(1, 0.85, 0.5) // Warm golden tones
      .saturate(1.3)
      .contrast(1.4)
      .brightness(0.15)
      .modulate(
        window.osc(8, 0, 0.08).rotate(Math.PI / 4),
        reflection * 0.25
      )
      .scrollX(0.35) // Position to bottom right
      .scrollY(0.35);
    
    // Combine main layer with inset (picture-in-picture) using blend
    window.src(distorted)
      .blend(insetLayer, layerBlend)
      .out(window.o0);
  };

  // Apply surrealGlitch effect
  const applySurrealGlitch = () => {
    if (!paramsRef.current || !window.s0) return;

    const params = paramsRef.current;
    const pinkSplash = params.get('pinkSplash');
    const pixelation = params.get('pixelation');
    const blockyArtifacts = params.get('blockyArtifacts');
    const glitchDist = params.get('glitchDistortion');
    const goldTint = params.get('goldTint');
    
    // Calculate pixelation scale
    const pixelScale = 0.05 + (1 - pixelation) * 0.25;
    
    // Pixelate the current video frame
    window.src(window.s0)
      .scale(pixelScale, pixelScale)
      .scale(1 / pixelScale, 1 / pixelScale)
      .thresh(0.5)
      .contrast(params.get('contrast') * 1.5)
      .saturate(params.get('saturation') * 1.3)
      .out(window.o1);
    
    // Create hot pink splash overlay
    const pinkMask = window.noise(0.3)
      .thresh(0.3 + pinkSplash * 0.4)
      .scale(0.1, 0.1)
      .scale(10, 10)
      .thresh(0.5);
    
    const pinkOverlay = window.src(window.s0)
      .color(1, 0.2, 0.8)
      .saturate(3)
      .brightness(0.5)
      .thresh(0.4)
      .mask(pinkMask);
    
    // Create square blocky artifacts
    const currentTime = window.time ?? 0;
    const blockyNoise = window.noise(0.2)
      .thresh(0.4 + blockyArtifacts * 0.4)
      .scale(0.03 + blockyArtifacts * 0.12, 0.03 + blockyArtifacts * 0.12)
      .scale(1 / (0.03 + blockyArtifacts * 0.12), 1 / (0.03 + blockyArtifacts * 0.12))
      .thresh(0.5)
      .scrollY(currentTime * 0.2)
      .scrollX(currentTime * 0.15);
    
    // Create square glitch blocks
    const glitchLines = window.noise(100)
      .thresh(0.95)
      .scale(0.01, 0.01)
      .scale(100, 100)
      .thresh(0.9)
      .scrollY(currentTime * 1.5);
    
    // Temporal integration: blend current pixelated frame with previous frame
    const framePersistence = 0.85 + (1 - goldTint) * 0.1;
    
    // Create square distortion pattern
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
      .scrollX(params.get('scrollX') * (1 + glitchDist * 2))
      .scrollY(params.get('scrollY') * (1 + glitchDist * 2))
      .color(
        params.get('colorR') * (1 - pinkSplash * 0.3),
        params.get('colorG') * (1 - pinkSplash * 0.2),
        params.get('colorB') * (1 - pinkSplash * 0.1)
      )
      .blend(window.o0, framePersistence)
      .out(window.o0);
  };

  // Apply effects - Hydra's autoLoop handles continuous rendering
  // We only need to set up the effect chain once, Hydra will handle the rest
  useEffect(() => {
    if (!isPlaying || cameraError) return;

    // Apply effects once when playing starts
    // Hydra's autoLoop will handle continuous rendering
    if (paramsRef.current && window.s0) {
      try {
        applyWarmReflective(); // Use the new warm reflective effect
        console.log('WarmReflective effect applied');
      } catch (error) {
        console.error('Error applying initial effects:', error);
      }
    }
  }, [isPlaying, cameraError]);

  // Sync canvas size with video dimensions
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const updateCanvasSize = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    };

    video.addEventListener('loadedmetadata', updateCanvasSize);
    video.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize);
      video.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  const handleFullscreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isFullscreen) {
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      } else if ((canvas as any).webkitRequestFullscreen) {
        (canvas as any).webkitRequestFullscreen();
      } else if ((canvas as any).mozRequestFullScreen) {
        (canvas as any).mozRequestFullScreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000' }}>
      {/* Video Display */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          position: 'relative',
        }}
      >
        {cameraError ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
            <div>Camera Error</div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#cccccc' }}>
              {cameraError}
            </div>
            <div style={{ fontSize: '10px', marginTop: '16px', color: '#888888' }}>
              Please allow camera access and refresh
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              style={{
                position: 'absolute',
                width: 0,
                height: 0,
                opacity: 0,
                pointerEvents: 'none',
              }}
              controls={false}
              playsInline
              muted
              autoPlay
            />
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
              }}
            />
          </>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          padding: '8px',
          background: '#1a1a1a',
          borderTop: '1px solid #000000',
        }}
      >
        {/* Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="win-button" onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <div style={{ flex: 1 }} />
          <button className="win-button" onClick={handleFullscreen} title="Fullscreen">
            ⛶
          </button>
        </div>

        {/* Camera Info */}
        <div style={{ fontSize: '10px', color: '#888888', marginTop: '4px' }}>
          {cameraError ? 'Camera unavailable' : 'Front Camera - Surreal Glitch Effect (h)'}
        </div>
      </div>
    </div>
  );
};

