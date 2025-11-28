import { ImageSettings, LogoSettings } from './types';

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  ditherType: 'none',
  colorMode: true,
  ditherIntensity: 50,
  pixelate: 0,
  noise: 0,
  glitch: 0,
  rgbShift: 0,
};

export const DEFAULT_LOGO_SETTINGS: LogoSettings = {
  size: 20,
  opacity: 100,
  position: 'bottom-right',
};

// 4x4 Bayer Matrix for Ordered Dithering
export const BAYER_MATRIX_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
