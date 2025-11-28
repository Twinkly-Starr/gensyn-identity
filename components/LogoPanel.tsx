import React from 'react';
import DraggablePanel from './DraggablePanel';
import { LogoSettings } from '../types';

interface LogoPanelProps {
  settings: LogoSettings;
  updateSettings: (key: keyof LogoSettings, value: any) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPresetSelect: (url: string) => void;
  activePreset: string | null;
}

const LOGO_PRESETS = [
  { label: 'White', url: 'https://i.postimg.cc/QNcnw0Zd/Gensyn-Logo-Inline-White.png' },
  { label: 'Brown', url: 'https://i.postimg.cc/8cTdqdLp/Gensyn-Logo-Inline-Brown.png' },
  { label: 'Pink', url: 'https://i.postimg.cc/XYtfV69m/Gensyn-Logo-Inline-Pink.png' },
];

const LogoPanel: React.FC<LogoPanelProps> = ({ 
  settings, 
  updateSettings, 
  onLogoUpload, 
  onPresetSelect, 
  activePreset 
}) => {
  return (
    <DraggablePanel title="IDENTITY.OVL" initialPos={{ x: window.innerWidth - 320, y: 80 }}>
      {/* Branding Module */}
      <div className="flex flex-col gap-3 border-b border-gensyn-primary/30 pb-4">
        <label className="text-xs uppercase opacity-70">Branding Module</label>
        
        {/* Presets Library */}
        <div className="grid grid-cols-3 gap-2">
          {LOGO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onPresetSelect(preset.url)}
              className={`
                aspect-square flex items-center justify-center p-2 
                border transition-all relative overflow-hidden group
                ${activePreset === preset.url 
                  ? 'border-gensyn-primary bg-gensyn-primary/10 shadow-[0_0_10px_rgba(250,215,209,0.15)]' 
                  : 'border-gensyn-primary/30 hover:border-gensyn-primary/60 hover:bg-gensyn-primary/5'}
              `}
              title={`Apply ${preset.label} Logo`}
            >
              {/* Image Preview */}
              <img 
                src={preset.url} 
                alt={preset.label}
                className="w-full h-full object-contain pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
                onError={(e) => {
                    // Fallback visual if URL is a page instead of image (common with ibb.co landing links)
                    // We hide the broken image and show text
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className="hidden absolute inset-0 flex items-center justify-center text-[10px] text-center font-mono uppercase break-all p-1">
                {preset.label}
              </span>
            </button>
          ))}
        </div>

        {/* Custom Upload */}
        <label className="cursor-pointer text-[10px] uppercase tracking-wider bg-[#0a0a0a] hover:bg-gensyn-primary/10 border border-dashed border-gensyn-primary/40 hover:border-gensyn-primary p-2 text-center transition-all text-gensyn-primary/70 hover:text-gensyn-primary">
            <input type="file" className="hidden" accept="image/png" onChange={onLogoUpload} />
            <span>+ Upload Custom</span>
        </label>
      </div>

      {/* Size & Opacity */}
      {[
        { label: 'Size (%)', key: 'size', min: 10, max: 50 },
        { label: 'Opacity', key: 'opacity', min: 0, max: 100 },
      ].map((control) => (
        <div key={control.key} className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="uppercase">{control.label}</label>
            <span className="opacity-70">{String(settings[control.key as keyof LogoSettings]).padStart(3, '0')}</span>
          </div>
          <input
            type="range"
            min={control.min}
            max={control.max}
            value={settings[control.key as keyof LogoSettings] as number}
            onChange={(e) => updateSettings(control.key as keyof LogoSettings, Number(e.target.value))}
            className="w-full h-2 bg-[#0a0a0a] border border-gensyn-primary/30 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gensyn-primary cursor-pointer"
          />
        </div>
      ))}

      {/* Position */}
      <div className="space-y-2 pt-2">
         <label className="text-xs uppercase opacity-70">Anchor Position</label>
         <div className="grid grid-cols-3 gap-1">
            {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map(pos => (
                <button
                    key={pos}
                    onClick={() => updateSettings('position', pos)}
                    className={`text-[10px] p-1 border border-gensyn-primary uppercase ${settings.position === pos ? 'bg-gensyn-primary text-[#230800]' : 'text-gensyn-primary hover:bg-gensyn-primary/20'}`}
                >
                    {pos.replace('-', ' ')}
                </button>
            ))}
         </div>
      </div>
    </DraggablePanel>
  );
};

export default LogoPanel;