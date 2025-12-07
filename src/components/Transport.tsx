import React from 'react';
import { useProject } from '../context/ProjectContext';
import { Play, Pause, Plus, ZoomIn, ZoomOut } from 'lucide-react';
import { formatTime } from '../utils/audio';

export const Transport: React.FC = () => {
  const { state, dispatch, play, pause, addTrackFromFile } = useProject();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        addTrackFromFile(file);
      });
    }
  };

  const togglePlay = () => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const zoomIn = () => dispatch({ type: 'SET_ZOOM', payload: Math.min(state.zoom * 1.5, 500) });
  const zoomOut = () => dispatch({ type: 'SET_ZOOM', payload: Math.max(state.zoom / 1.5, 10) });

  return (
    <div className="h-24 bg-bg-graphite border-t border-bg-slate flex items-center justify-between px-4 pb-safe shrink-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          className="w-14 h-14 rounded-full bg-accent-primary text-bg-ink flex items-center justify-center shadow-lg shadow-accent-primary/20 active:scale-95 transition-transform"
          onClick={togglePlay}
        >
          {state.isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>
        
        <div className="flex flex-col">
          <span className="text-2xl font-mono font-medium text-text-high leading-none">
            {formatTime(state.currentTime)}
          </span>
          <span className="text-xs text-text-dim">
            / {formatTime(state.duration)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex bg-bg-slate rounded-xl p-1 mr-2">
           <button onClick={zoomOut} className="p-2 text-text-dim hover:text-text-high"><ZoomOut size={18} /></button>
           <button onClick={zoomIn} className="p-2 text-text-dim hover:text-text-high"><ZoomIn size={18} /></button>
        </div>

        <label className="w-10 h-10 rounded-xl bg-bg-slate flex items-center justify-center text-text-high cursor-pointer active:bg-bg-charcoal transition-colors">
          <Plus size={24} />
          <input 
            type="file" 
            accept="audio/*,.m4a,audio/mp4,audio/x-m4a,audio/mpeg,audio/wav"
            multiple 
            className="hidden" 
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
};
