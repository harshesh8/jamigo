import React, { useRef, useEffect, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { TrackRow } from './TrackRow';
import { formatTime } from '../utils/audio';

export const Timeline: React.FC = () => {
  const { state, seek } = useProject();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
        if (scrollContainerRef.current) {
            setContainerWidth(scrollContainerRef.current.clientWidth);
        }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Ensure timeline is at least as wide as the screen
  // But also respects duration * zoom
  const contentWidth = Math.max(containerWidth, state.duration * state.zoom + 100); // +100 for padding

  const handleRulerClick = (e: React.MouseEvent) => {
    // Correct for the sticky left header width (96px = 6rem = w-24)
    // Actually, if we click on the ruler part (right of header), the offsetX is what we want.
    // But the ruler element itself starts *after* the corner.
    
    const x = e.nativeEvent.offsetX;
    const time = Math.max(0, x / state.zoom);
    seek(time);
  };

  return (
    <div 
      className="flex-1 overflow-auto bg-bg-ink relative scroll-smooth" 
      ref={scrollContainerRef}
    >
      <div 
        className="relative min-h-full flex flex-col"
        style={{ width: contentWidth }}
      >
        {/* Top Sticky Bar (Ruler) */}
        <div className="sticky top-0 z-40 flex h-8 bg-bg-charcoal border-b border-bg-slate shrink-0">
            {/* Corner (Sticky Left + Top) */}
            <div className="sticky left-0 z-50 w-24 bg-bg-charcoal border-r border-bg-slate shrink-0 flex items-center justify-center text-xs text-text-dim font-bold shadow-sm">
                TRACKS
            </div>
            
            {/* Ruler Marks */}
            <div 
                className="flex-1 relative cursor-pointer overflow-hidden"
                onClick={handleRulerClick}
            >
                {/* Ticks */}
                {Array.from({ length: Math.ceil(state.duration) }).map((_, i) => (
                    <div 
                    key={i} 
                    className="absolute bottom-0 border-l border-bg-slate h-4 pl-1 flex items-center"
                    style={{ left: i * state.zoom }}
                    >
                    <span className="text-[10px] text-text-dim select-none">{i % 5 === 0 ? formatTime(i) : ''}</span>
                    </div>
                ))}
                
                {/* Playhead Triangle Handle */}
                <div 
                   className="absolute top-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary transform -translate-x-1/2 transition-transform duration-75"
                   style={{ left: state.currentTime * state.zoom }}
                />
            </div>
        </div>

        {/* Timeline Body */}
        <div className="flex-1 relative">
             {/* Global Playhead Line */}
             <div 
                className="absolute top-0 bottom-0 w-[2px] bg-primary z-30 pointer-events-none transition-transform duration-75"
                style={{ 
                    left: (state.currentTime * state.zoom) + 96, // Offset by header width (w-24 = 96px)
                    // Wait, playhead should be inside the right pane?
                    // If playhead is absolute to "Timeline Body", it needs to account for the sticky header width IF it's placed relative to the container.
                    // Actually, let's put the Playhead Line INSIDE the track area components or a dedicated overlay that respects the flex layout.
                }}
             />
             
             {/* Playhead Overlay Container (Right side only) */}
             <div className="absolute top-0 bottom-0 left-24 right-0 pointer-events-none overflow-visible">
                <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-primary shadow-[0_0_10px_rgba(255,189,31,0.5)]"
                    style={{ left: state.currentTime * state.zoom }}
                ></div>
             </div>
             
             {/* Grid */}
             <div className="absolute top-0 bottom-0 left-24 right-0 pointer-events-none">
                {Array.from({ length: Math.ceil(state.duration / 5) }).map((_, i) => (
                    <div 
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-bg-slate/10"
                    style={{ left: i * 5 * state.zoom }}
                    />
                ))}
             </div>

             {/* Tracks */}
             <div className="pb-32">
                 {state.tracks.map(track => (
                     <TrackRow key={track.id} track={track} />
                 ))}
             </div>
        </div>
      </div>
    </div>
  );
};
