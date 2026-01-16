'use client';

import { useEffect, useRef, useState } from 'react';

export type VisualizerMode = 'battery' | 'bars' | 'waveform' | 'scope';

interface UseAudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  enabled: boolean;
  mode?: VisualizerMode;
}

export const useAudioVisualizer = ({
  audioElement,
  enabled,
  mode = 'battery',
}: UseAudioVisualizerProps) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioElement || !enabled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Cleanup on disable
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        sourceRef.current = null;
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
      return;
    }

    // Check if audio element is already connected to a source
    // We need to reuse the existing context or create a new one carefully
    let context: AudioContext;
    let source: MediaElementAudioSourceNode;
    
    try {
      // Try to create AudioContext
      context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;

      const bufferLength = analyserNode.frequencyBinCount;
      const data = new Uint8Array(bufferLength);
      setDataArray(data);
      dataArrayRef.current = data;

      // Check if audio element already has a source connected
      // If it does, we need to disconnect it first or use a different approach
      try {
        source = context.createMediaElementSource(audioElement);
        source.connect(analyserNode);
        analyserNode.connect(context.destination);
      } catch (error: any) {
        // If the element is already connected, we can't create another source
        // In this case, we'll use the audio element's audioTracks or try a different approach
        console.warn('Audio element already connected, using alternative method:', error);
        // Close the context we created since we can't use it
        context.close();
        return;
      }

      sourceRef.current = source;
      setAudioContext(context);
      setAnalyser(analyserNode);
    } catch (error) {
      console.error('Error setting up audio visualizer:', error);
      return;
    }

    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        sourceRef.current = null;
      }
      if (context && context.state !== 'closed') {
        context.close();
      }
    };
  }, [audioElement, enabled]);

  const getFrequencyData = (): Uint8Array | null => {
    if (!analyser || !dataArrayRef.current) return null;
    // @ts-expect-error - Web Audio API accepts Uint8Array but TypeScript types are strict
    analyser.getByteFrequencyData(dataArrayRef.current);
    return dataArrayRef.current;
  };

  const getWaveformData = (): Uint8Array | null => {
    if (!analyser || !dataArrayRef.current) return null;
    // @ts-expect-error - Web Audio API accepts Uint8Array but TypeScript types are strict
    analyser.getByteTimeDomainData(dataArrayRef.current);
    return dataArrayRef.current;
  };

  const getData = (): Uint8Array | null => {
    if (mode === 'waveform') {
      return getWaveformData();
    }
    // battery + bars rely on frequency data
    return getFrequencyData();
  };

  return {
    audioContext,
    analyser,
    dataArray,
    getFrequencyData,
    getWaveformData,
    getData,
    mode,
  };
};

