// Simplified ParameterController for Hydra effects
export class ParameterController {
  private parameters: Record<string, { value: number; min: number; max: number; step: number }>;

  constructor() {
    this.parameters = {
      // Global parameters
      scrollX: { value: -0.001, min: -0.1, max: 0.1, step: 0.0001 },
      scrollY: { value: -0.00141, min: -0.1, max: 0.1, step: 0.0001 },
      modulation: { value: -0.001, min: -1, max: 1, step: 0.001 },
      contrast: { value: 1.1, min: 0, max: 3, step: 0.1 },
      saturation: { value: 1.1, min: 0, max: 3, step: 0.1 },
      blend: { value: 0.2, min: 0, max: 1, step: 0.01 },
      
      // Color parameters
      colorR: { value: 1, min: 0, max: 1, step: 0.01 },
      colorG: { value: 0.4, min: 0, max: 1, step: 0.01 },
      colorB: { value: 1.0, min: 0, max: 1, step: 0.01 },
      
      // Surreal glitch effect parameters
      pinkSplash: { value: 0.4, min: 0, max: 1, step: 0.01 },
      pixelation: { value: 0.3, min: 0, max: 1, step: 0.01 },
      blockyArtifacts: { value: 0.5, min: 0, max: 1, step: 0.01 },
      glitchDistortion: { value: 0.6, min: 0, max: 1, step: 0.01 },
      goldTint: { value: 0.3, min: 0, max: 1, step: 0.01 },
      
      // Warm reflective effect parameters
      warmth: { value: 0.7, min: 0, max: 1, step: 0.01 },
      reflection: { value: 0.6, min: 0, max: 1, step: 0.01 },
      texture: { value: 0.5, min: 0, max: 1, step: 0.01 },
      glow: { value: 0.8, min: 0, max: 1, step: 0.01 },
      layerBlend: { value: 0.4, min: 0, max: 1, step: 0.01 },
      distortion: { value: 0.3, min: 0, max: 1, step: 0.01 },
      
      // Source toggle: 0 = s0, 1 = s1
      sourceToggle: { value: 0, min: 0, max: 1, step: 1 },
    };
  }
  
  get(name: string): number {
    return this.parameters[name]?.value ?? 0;
  }
  
  set(name: string, value: number): void {
    if (this.parameters[name]) {
      const param = this.parameters[name];
      param.value = Math.max(param.min, Math.min(param.max, value));
    }
  }
  
  add(name: string, delta: number): void {
    if (this.parameters[name]) {
      const param = this.parameters[name];
      this.set(name, param.value + delta * param.step);
    }
  }
}
