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
      return;
    }

    // Create AudioContext
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.8;

    const bufferLength = analyserNode.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    setDataArray(data);
    dataArrayRef.current = data;

    // Connect audio element to analyser
    const source = context.createMediaElementSource(audioElement);
    source.connect(analyserNode);
    analyserNode.connect(context.destination);

    sourceRef.current = source;
    setAudioContext(context);
    setAnalyser(analyserNode);

    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
      if (context.state !== 'closed') {
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

