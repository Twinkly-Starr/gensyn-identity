
import { ImageSettings, LogoSettings } from '../types';
import { BAYER_MATRIX_4X4 } from '../constants';

// Deterministic Pseudo-Random Number Generator
// Needed to keep Glitch slices static when other sliders change
const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

export const processCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sourceImage: HTMLImageElement | null,
  logoImage: HTMLImageElement | null,
  settings: ImageSettings,
  logoSettings: LogoSettings,
  glitchSeed: number
) => {
  // --- PIPELINE STEP 1: CLEAR CANVAS ---
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  if (!sourceImage) return;

  // --- PIPELINE STEP 2: DRAW BASE (With Pixelation) ---
  // We handle pixelation by drawing to a smaller offscreen canvas then scaling up
  const pixelateScale = settings.pixelate > 0 
      ? Math.max(0.01, 1 - (settings.pixelate / 100) * 0.98) 
      : 1;
      
  const w = Math.floor(width * pixelateScale);
  const h = Math.floor(height * pixelateScale);
  
  const offCanvas = document.createElement('canvas');
  offCanvas.width = w;
  offCanvas.height = h;
  const offCtx = offCanvas.getContext('2d');
  
  if (!offCtx) return;

  // Calculate "Cover" dimensions
  const aspect = sourceImage.width / sourceImage.height;
  const canvasAspect = width / height;
  let sx, sy, sWidth, sHeight;
  
  if (aspect > canvasAspect) {
      sHeight = sourceImage.height;
      sWidth = sHeight * canvasAspect;
      sy = 0;
      sx = (sourceImage.width - sWidth) / 2;
  } else {
      sWidth = sourceImage.width;
      sHeight = sWidth / canvasAspect;
      sx = 0;
      sy = (sourceImage.height - sHeight) / 2;
  }

  // Draw scaled down
  offCtx.imageSmoothingEnabled = true; // Smooth input when downscaling
  offCtx.drawImage(sourceImage, sx, sy, sWidth, sHeight, 0, 0, w, h);

  // Draw scaled up (Nearest Neighbor for sharp pixels)
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offCanvas, 0, 0, w, h, 0, 0, width, height);


  // --- PIPELINE STEP 3: APPLY GLITCH (Independent) ---
  // We use the glitchSeed to ensure these slices don't move unless glitch slider moves
  if (settings.glitch > 0) {
    const glitchIntensity = settings.glitch / 100;
    // Number of slices based on intensity
    const numSlices = Math.floor(glitchIntensity * 20) + 1;
    let seed = glitchSeed;

    for (let i = 0; i < numSlices; i++) {
        // Deterministic randoms
        const rY = seededRandom(seed++);
        const rH = seededRandom(seed++);
        const rO = seededRandom(seed++);

        const sliceY = Math.floor(rY * height);
        const sliceH = Math.floor(rH * (height / 5)) + 5; // Max 20% height
        const offset = (rO - 0.5) * (width * glitchIntensity * 0.5); // Max 50% width shift

        // Draw slice from current canvas state to itself with offset
        ctx.drawImage(ctx.canvas, 0, sliceY, width, sliceH, offset, sliceY, width, sliceH);
    }
  }

  // --- PREPARE FOR PIXEL MANIPULATION ---
  const imgData = ctx.getImageData(0, 0, width, height);
  // Use Float32 for precise error diffusion handling (prevents rounding errors in low intensity FS)
  // We copy the Uint8ClampedArray to Float32Array
  const buffer = new Float32Array(imgData.data);
  // We need a read-only copy for RGB Shift to prevent "smearing" (reading pixels we just wrote)
  const sourceBuffer = new Float32Array(imgData.data);

  const noiseAmount = settings.noise; // 0-100
  const rgbShiftAmt = Math.floor((settings.rgbShift / 100) * (width * 0.04)); // Max 4% shift
  const ditherVal = settings.ditherIntensity; // 0-100

  // --- PIPELINE STEP 4, 5, 6: PIXEL LOOP ---
  // Combined loop for performance.
  // Order: RGB Shift -> Color Mode -> Noise -> Dither
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // 1. RGB Shift
      let r, g, b;
      if (rgbShiftAmt > 0) {
          const lIdx = (y * width + Math.max(0, x - rgbShiftAmt)) * 4;
          const rIdx = (y * width + Math.min(width - 1, x + rgbShiftAmt)) * 4;
          r = sourceBuffer[lIdx];     // Red from Left
          g = sourceBuffer[idx + 1];  // Green from Center
          b = sourceBuffer[rIdx + 2]; // Blue from Right
      } else {
          r = buffer[idx];
          g = buffer[idx + 1];
          b = buffer[idx + 2];
      }

      // 2. Color Mode (Grayscale)
      // We calculate Luma regardless because Dither often needs it
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (!settings.colorMode) {
          r = g = b = luma;
      }

      // 3. Apply Noise
      if (noiseAmount > 0) {
          // Random noise per pixel (independent of everything else)
          const n = (Math.random() - 0.5) * (noiseAmount * 2.55);
          r += n;
          g += n;
          b += n;
      }

      // Clamp before Dither
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      // 4. Apply Dither
      if (settings.ditherType !== 'none') {
          if (settings.ditherType === 'threshold') {
              // Map slider 0-100 to Threshold 0-255
              const thresh = (ditherVal / 100) * 255;
              r = r < thresh ? 0 : 255;
              g = g < thresh ? 0 : 255;
              b = b < thresh ? 0 : 255;
          
          } else if (settings.ditherType === 'ordered') {
             // Map slider 0-100 to Contrast/Strength of Bayer Matrix
             // Standard Ordered Dither: Pixel + (Bayer - 0.5) * Spread > 128
             const bayerMap = BAYER_MATRIX_4X4[y % 4][x % 4]; // 0-15
             const bayerNorm = (bayerMap / 16) - 0.5; // -0.5 to 0.5
             
             // Spread factor based on intensity
             const spread = (ditherVal / 100) * 255; 
             
             const thresh = 128 + (bayerNorm * spread); // Dynamic threshold center
             
             // Note: For classic ordered look, we usually compare pixel to matrix.
             // Here we use the slider to control how "strong" the pattern is vs the image.
             // If Intensity is high, the matrix dominates.
             
             r = r < thresh ? 0 : 255;
             g = g < thresh ? 0 : 255;
             b = b < thresh ? 0 : 255;

          } else if (settings.ditherType === 'floyd-steinberg') {
             // Map slider 0-100 to Error Diffusion Multiplier
             const errMult = ditherVal / 100;

             // Quantize to 1-bit (or 3-bit color)
             // We use 128 as fixed midpoint for FS
             const oldR = r;
             const oldG = g;
             const oldB = b;
             
             const newR = oldR < 128 ? 0 : 255;
             const newG = oldG < 128 ? 0 : 255;
             const newB = oldB < 128 ? 0 : 255;

             r = newR;
             g = newG;
             b = newB;
             
             if (errMult > 0) {
                 const errR = (oldR - newR) * errMult;
                 const errG = (oldG - newG) * errMult;
                 const errB = (oldB - newB) * errMult;
                 
                 // Distribute Error to Neighbors in the Float Buffer
                 // Right
                 if (x + 1 < width) {
                     const nid = (y * width + x + 1) * 4;
                     buffer[nid] += errR * 0.4375;
                     buffer[nid+1] += errG * 0.4375;
                     buffer[nid+2] += errB * 0.4375;
                 }
                 // Bottom Left
                 if (x - 1 >= 0 && y + 1 < height) {
                     const nid = ((y + 1) * width + x - 1) * 4;
                     buffer[nid] += errR * 0.1875;
                     buffer[nid+1] += errG * 0.1875;
                     buffer[nid+2] += errB * 0.1875;
                 }
                 // Bottom
                 if (y + 1 < height) {
                     const nid = ((y + 1) * width + x) * 4;
                     buffer[nid] += errR * 0.3125;
                     buffer[nid+1] += errG * 0.3125;
                     buffer[nid+2] += errB * 0.3125;
                 }
                 // Bottom Right
                 if (x + 1 < width && y + 1 < height) {
                     const nid = ((y + 1) * width + x + 1) * 4;
                     buffer[nid] += errR * 0.0625;
                     buffer[nid+1] += errG * 0.0625;
                     buffer[nid+2] += errB * 0.0625;
                 }
             }
          }
      }

      // Write back to buffer
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
    }
  }

  // Copy float buffer back to Uint8ClampedArray for canvas
  for (let i = 0; i < buffer.length; i++) {
      imgData.data[i] = buffer[i];
  }

  ctx.putImageData(imgData, 0, 0);

  // --- PIPELINE STEP 7: DRAW LOGO ---
  if (logoImage) {
    const logoW = width * (logoSettings.size / 100);
    const logoH = logoW * (logoImage.height / logoImage.width);
    
    let lx = 0;
    let ly = 0;
    const padding = width * 0.05;

    switch (logoSettings.position) {
      case 'top-left':
        lx = padding;
        ly = padding;
        break;
      case 'top-right':
        lx = width - logoW - padding;
        ly = padding;
        break;
      case 'bottom-left':
        lx = padding;
        ly = height - logoH - padding;
        break;
      case 'bottom-right':
        lx = width - logoW - padding;
        ly = height - logoH - padding;
        break;
      case 'center':
        lx = (width - logoW) / 2;
        ly = (height - logoH) / 2;
        break;
    }

    ctx.save();
    ctx.globalAlpha = logoSettings.opacity / 100;
    ctx.drawImage(logoImage, lx, ly, logoW, logoH);
    ctx.restore();
  }
};
