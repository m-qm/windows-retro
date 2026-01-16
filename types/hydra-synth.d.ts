declare module 'hydra-synth' {
  interface HydraOptions {
    canvas?: HTMLCanvasElement;
    autoLoop?: boolean;
    detectAudio?: boolean;
    precision?: 'lowp' | 'mediump' | 'highp';
  }

  class Hydra {
    constructor(options?: HydraOptions);
  }

  export default Hydra;
}
