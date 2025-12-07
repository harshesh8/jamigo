import React, { useState } from 'react';
import type { Track } from '../types';
import { ClipItem } from './ClipItem';
import { Volume2, VolumeX, Trash2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

interface TrackRowProps {
  track: Track;
  height?: number;
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, height = 96 }) => {
  const { dispatch } = useProject();
  const [isMuted, setIsMuted] = useState(false);

  const handleDelete = () => {
      if(confirm(`Delete track "${track.name}"?`)) {
          dispatch({ type: 'DELETE_TRACK', payload: { id: track.id } });
      }
  }

  return (
    <div 
        className="flex relative shrink-0 group" 
        style={{ height }}
    >
      {/* Sticky Header */}
      <div className="sticky left-0 z-30 w-16 bg-bg-graphite border-r border-bg-slate flex flex-col justify-center items-center px-1 gap-2 shadow-md">
         {/* Name removed as requested */}
         <div className="w-1 h-8 rounded-full" style={{ backgroundColor: track.color }}></div>
         
         <div className="flex flex-col items-center gap-2">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-1.5 rounded-md ${isMuted ? 'bg-accent-primary text-bg-ink' : 'bg-bg-slate text-text-dim'}`}
            >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            
            <button 
                onClick={handleDelete}
                className="p-1.5 rounded-md hover:bg-red-500/20 text-text-dim hover:text-red-500 transition-opacity"
            >
                <Trash2 size={16} />
            </button>
         </div>
      </div>

      {/* Clips Container Background */}
      <div className="absolute inset-0 bg-bg-graphite/30 border-b border-bg-slate/30 pointer-events-none" />

      {/* Clips Area */}
      <div className="relative flex-1">
        {track.clips.map(clip => (
          <ClipItem key={clip.id} clip={clip} trackColor={track.color} />
        ))}
      </div>
    </div>
  );
};
