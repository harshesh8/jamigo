import React from 'react';
import { useProject } from '../context/ProjectContext';
import { Download, Clock } from 'lucide-react';
import { formatTime } from '../utils/audio';
import logo from '../assets/logo.png';

export const Header: React.FC = () => {
  const { state, dispatch, exportMix } = useProject();

  const handleDurationClick = () => {
    const newDuration = prompt("Enter project duration in seconds:", state.duration.toString());
    if (newDuration && !isNaN(Number(newDuration))) {
        dispatch({ type: 'SET_DURATION', payload: Number(newDuration) });
    }
  };

  return (
    <header className="h-16 px-4 flex items-center justify-between bg-bg-graphite border-b border-bg-slate shrink-0 z-20">
      <div className="flex items-center gap-3">
        <img 
            src={logo} 
            alt="Jamigo Logo" 
            className="h-10 w-auto object-contain"
        />
        <h1 className="text-xl font-bold tracking-tight text-text-high">Jamigo</h1>
      </div>

      <div className="flex items-center gap-3">
        <button 
            onClick={handleDurationClick}
            className="px-3 py-2 rounded-xl bg-bg-slate text-text-dim hover:text-text-high transition-colors flex items-center gap-2 text-sm font-mono"
            title="Set Project Duration"
        >
          <Clock size={16} />
          <span>{formatTime(state.duration)}</span>
        </button>
        
        <button 
          onClick={() => exportMix()}
          className="bg-accent-primary text-bg-ink font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent-primary/20"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};
