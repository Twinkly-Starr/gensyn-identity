import React from 'react';
import DraggablePanel from './DraggablePanel';
import { ImageSettings, DitherType } from '../types';

interface ControlPanelProps {
  settings: ImageSettings;
  updateSettings: (key: keyof ImageSettings, value: any) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, updateSettings, onImageUpload, onExport }) => {
  return (
    <DraggablePanel title="SYSTEM.CTRL" initialPos={{ x: 20, y: 80 }}>
      {/* Upload */}
      <div className="flex flex-col gap-2 border-b border-gensyn-primary/30 pb-4">
        <label className="text-xs uppercase opacity-70">Source Input</label>
        <label className="cursor-pointer bg-gensyn-primary/10 hover:bg-gensyn-primary/20 border border-gensyn-primary border-dashed p-2 text-center transition-colors">
          <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
          <span>[UPLOAD IMAGE]</span>
        </label>
      </div>

      {/* Dither Controls */}
      <div className="space-y-2">
        <label className="flex justify-between text-xs uppercase opacity-70">
            <span>Dither Mode</span>
        </label>
        <select 
          value={settings.ditherType}
          onChange={(e) => updateSettings('ditherType', e.target.value as DitherType)}
          className="w-full bg-[#0a0a0a] border border-gensyn-primary text-gensyn-primary p-1 focus:outline-none focus:ring-1 focus:ring-gensyn-primary"
        >
          <option value="none">None</option>
          <option value="floyd-steinberg">Floyd-Steinberg</option>
          <option value="threshold">Threshold</option>
          <option value="ordered">Ordered (Bayer)</option>
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
             <label className="text-xs uppercase opacity-70">Colour Mode</label>
             <button 
                onClick={() => updateSettings('colorMode', !settings.colorMode)}
                className={`w-8 h-4 border border-gensyn-primary flex items-center p-0.5 ${settings.colorMode ? 'justify-end bg-gensyn-primary/20' : 'justify-start bg-transparent'}`}
             >
                <div className={`w-2.5 h-2.5 bg-gensyn-primary ${settings.colorMode ? 'bg-gensyn-primary' : 'bg-gensyn-primary/50'}`}></div>
             </button>
        </div>
      </div>

      {/* Sliders */}
      {[
        { label: 'Intensity', key: 'ditherIntensity' },
        { label: 'Pixelate', key: 'pixelate' },
        { label: 'Noise', key: 'noise' },
        { label: 'Glitch', key: 'glitch' },
        { label: 'RGB Shift', key: 'rgbShift' },
      ].map((control) => (
        <div key={control.key} className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="uppercase">{control.label}</label>
            <span className="opacity-70">{String(settings[control.key as keyof ImageSettings]).padStart(3, '0')}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings[control.key as keyof ImageSettings] as number}
            onChange={(e) => updateSettings(control.key as keyof ImageSettings, Number(e.target.value))}
            className="w-full h-2 bg-[#0a0a0a] border border-gensyn-primary/30 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gensyn-primary cursor-pointer"
          />
        </div>
      ))}

      {/* Export */}
      <div className="pt-4 border-t border-gensyn-primary/30">
        <button 
          onClick={onExport}
          className="w-full bg-gensyn-primary text-[#230800] py-2 font-bold hover:bg-white transition-colors uppercase tracking-widest"
        >
          Save Output
        </button>
      </div>

    </DraggablePanel>
  );
};

export default ControlPanel;
