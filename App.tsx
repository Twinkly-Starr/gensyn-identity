
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import LogoPanel from './components/LogoPanel';
import { ImageSettings, LogoSettings } from './types';
import { DEFAULT_IMAGE_SETTINGS, DEFAULT_LOGO_SETTINGS } from './constants';
import { processCanvas } from './services/imageProcessor';

const App: React.FC = () => {
  // State
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
  const [logoSettings, setLogoSettings] = useState<LogoSettings>(DEFAULT_LOGO_SETTINGS);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  
  // Dedicated seed for glitch effects to ensure independence
  const [glitchSeed, setGlitchSeed] = useState<number>(Date.now());
  
  // Image Sources
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load default placeholder on mount
  useEffect(() => {
    const img = new Image();
    img.src = "https://picsum.photos/1920/1080";
    img.crossOrigin = "Anonymous";
    img.onload = () => setSourceImage(img);
  }, []);

  // Update handlers
  const updateImageSettings = (key: keyof ImageSettings, value: any) => {
    setImageSettings(prev => ({ ...prev, [key]: value }));
    
    // CRITICAL: Only update the glitch seed if the Glitch slider itself is moving.
    // This ensures that adjusting Noise or Dither does NOT re-roll the random glitch slices.
    if (key === 'glitch') {
      setGlitchSeed(Math.random());
    }
  };

  const updateLogoSettings = (key: keyof LogoSettings, value: any) => {
    setLogoSettings(prev => ({ ...prev, [key]: value }));
  };

  // Render Loop: The "Strict Rendering Pipeline"
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Ensure canvas matches window exactly
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Execute the strict pipeline
    processCanvas(
        ctx, 
        canvas.width, 
        canvas.height, 
        sourceImage, 
        logoImage, 
        imageSettings, 
        logoSettings,
        glitchSeed
    );
  }, [sourceImage, logoImage, imageSettings, logoSettings, glitchSeed]);

  // Effect to trigger render on any state change
  useEffect(() => {
    requestAnimationFrame(render);
  }, [render]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => requestAnimationFrame(render);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // File Upload Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => setSourceImage(img);
        img.src = evt.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActivePreset(null); // Clear preset when custom uploading
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => setLogoImage(img);
        img.src = evt.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (url: string) => {
    setActivePreset(url);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => setLogoImage(img);
    img.onerror = () => {
        console.warn("Failed to load preset logo.");
    };
    img.src = url;
  };

  // Export
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // The canvas already contains the composited result of the pipeline (Base + Effects + Logo)
      const link = document.createElement('a');
      link.download = `gensyn-identity-${Date.now()}.png`;
      try {
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (e) {
        alert("Cannot export: Tainted canvas (CORS policy).");
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-gensyn-bg">
      {/* Background Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* Logo Title - Fixed Top Left */}
          <div className="absolute top-6 left-6 pointer-events-auto">
             <h1 className="font-header text-5xl text-gensyn-primary leading-none tracking-tighter">GENSYN</h1>
             <p className="font-mono text-xs text-white tracking-[0.3em] ml-1">IDENTITY PROTOCOL v1.0</p>
          </div>

          {/* Panels (Pointer Events re-enabled inside them) */}
          <div className="pointer-events-auto">
             <ControlPanel 
                settings={imageSettings} 
                updateSettings={updateImageSettings} 
                onImageUpload={handleImageUpload}
                onExport={handleExport}
             />
             <LogoPanel 
                settings={logoSettings} 
                updateSettings={updateLogoSettings}
                onLogoUpload={handleLogoUpload}
                onPresetSelect={handlePresetSelect}
                activePreset={activePreset}
             />
          </div>
      </div>
      
      {/* Visual Overlay Effects (CSS) */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 2px, 3px 100%'
      }}></div>
    </div>
  );
};

export default App;
