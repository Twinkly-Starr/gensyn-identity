export type DitherType = 'none' | 'floyd-steinberg' | 'threshold' | 'ordered';

export interface ImageSettings {
  ditherType: DitherType;
  colorMode: boolean; // true = color, false = grayscale
  ditherIntensity: number; // 0-100
  pixelate: number; // 0-100 (0 is no pixelation, 100 is blocky)
  noise: number; // 0-100
  glitch: number; // 0-100
  rgbShift: number; // 0-100
}

export interface LogoSettings {
  size: number; // 10-50 (%)
  opacity: number; // 0-100 (%)
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface Position {
  x: number;
  y: number;
}
