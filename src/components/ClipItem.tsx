import React, { useState, useMemo } from 'react';
import { useDrag } from '@use-gesture/react';
import type { Clip } from '../types';
import { useProject } from '../context/ProjectContext';
import { GripVertical, Trash2 } from 'lucide-react';

interface ClipItemProps {
  clip: Clip;
  trackColor: string;
}

export const ClipItem: React.FC<ClipItemProps> = ({ clip, trackColor }) => {
  const { state, dispatch } = useProject();
  const zoom = state.zoom;
  
  // Local state for smooth dragging without dispatching every frame to global store which might cause lag
  const [dragPosition, setDragPosition] = useState(clip.startTime * zoom);
  const [dragWidth, setDragWidth] = useState(clip.duration * zoom);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Memoize fake waveform bars to prevent flickering
  const waveformBars = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        height: 20 + Math.random() * 60
    }));
  }, []);

  // Sync with external state when not dragging
  React.useEffect(() => {
    if (!isDragging) {
      setDragPosition(clip.startTime * zoom);
      setDragWidth(clip.duration * zoom);
    }
  }, [clip.startTime, clip.duration, zoom, isDragging]);

  const bindPosition = useDrag(({ active, movement: [mx], memo = dragPosition, tap }) => {
    if (tap) {
        setShowControls(!showControls);
        return memo;
    }

    setIsDragging(active);
    const newX = Math.max(0, memo + mx);
    setDragPosition(newX);

    if (!active) {
      // Commit change
      const newStartTime = newX / zoom;
      dispatch({
        type: 'UPDATE_CLIP',
        payload: { id: clip.id, startTime: newStartTime }
      });
    }
    return memo;
  }, {
    filterTaps: true,
    pointer: { touch: true }
  });

  const bindRightResize = useDrag(({ active, movement: [mx], memo = dragWidth }) => {
    setIsDragging(active);
    const newWidth = Math.max(10, memo + mx); // Min width 10px
    setDragWidth(newWidth);

    if (!active) {
      // Commit duration change
      // Ensure we don't exceed source duration
      // Available duration = totalDuration - offset
      const maxDuration = clip.totalDuration - clip.offset;
      const proposedDuration = newWidth / zoom;
      const finalDuration = Math.min(proposedDuration, maxDuration);
      
      dispatch({
        type: 'UPDATE_CLIP',
        payload: { id: clip.id, duration: finalDuration }
      });
      // Snap back visual if we exceeded limit
      setDragWidth(finalDuration * zoom);
    }
    return memo;
  });

  const bindLeftResize = useDrag(({ active, movement: [mx], memo = { pos: dragPosition, width: dragWidth, offset: clip.offset } }) => {
    setIsDragging(active);
    
    // Calculate potential new position
    // Limit: cannot go before 0
    // Limit: cannot go past end of clip (min width)
    // Limit: cannot go into negative offset (offset must be >= 0)
    
    // This is complex. Let's simplify:
    // Delta x -> Delta time
    
    const deltaPixels = mx;
    // If moving right (positive), we are trimming the start (increasing offset, decreasing duration, increasing startTime)
    // If moving left (negative), we are untrimming start (decreasing offset, increasing duration, decreasing startTime)

    // Max left movement = -offset * zoom (can't have negative offset)
    // Max right movement = (duration - min_duration) * zoom
    
    const initialX = memo.pos;
    const initialWidth = memo.width;
    
    let newX = initialX + deltaPixels;
    let newWidth = initialWidth - deltaPixels;
    
    if (newWidth < 10) {
        newX = initialX + (initialWidth - 10);
        newWidth = 10;
    }
    
    // Check start boundary (offset)
    // newStartTime = newX / zoom
    // deltaStartTime = (newX - initialX) / zoom
    // newOffset = initialOffset + deltaStartTime
    
    const deltaStartTime = (newX - initialX) / zoom;
    const newOffset = memo.offset + deltaStartTime;
    
    if (newOffset < 0) {
        // Clamped at 0 offset
        // deltaStartTime = -initialOffset
        // newX = initialX - initialOffset * zoom
        const clampedDelta = -memo.offset * zoom;
        newX = initialX + clampedDelta;
        newWidth = initialWidth - clampedDelta;
    }

    setDragPosition(newX);
    setDragWidth(newWidth);

    if (!active) {
      const finalStartTime = newX / zoom;
      const finalDuration = newWidth / zoom;
      const finalOffset = memo.offset + (finalStartTime - (initialX / zoom));

      dispatch({
        type: 'UPDATE_CLIP',
        payload: { 
            id: clip.id, 
            startTime: finalStartTime,
            duration: finalDuration,
            offset: finalOffset
        }
      });
    }
    
    return memo;
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this clip?')) {
        dispatch({ type: 'REMOVE_CLIP', payload: { id: clip.id } });
    }
  };

  return (
    <div 
      className="absolute top-1 bottom-1 rounded-xl overflow-visible group touch-none select-none"
      style={{ 
        left: dragPosition, 
        width: dragWidth,
        backgroundColor: trackColor, 
        // Add a subtle shadow and border
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: isDragging ? 50 : 1
      }}
    >
      {/* Main Drag Area */}
      <div 
        {...bindPosition()} 
        className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden rounded-xl flex items-center justify-center px-2"
      >
        {/* Name REMOVED as requested */}
        
        {/* Fake Waveform visualization (bars) with padding */}
        <div className="absolute inset-2 flex items-center justify-around opacity-30 pointer-events-none">
           {waveformBars.map((bar) => (
               <div key={bar.id} className="w-1 bg-bg-ink rounded-full" style={{ height: `${bar.height}%` }} />
           ))}
        </div>
      </div>

      {/* Left Handle */}
      <div 
        {...bindLeftResize()}
        className="absolute left-0 top-0 bottom-0 w-6 -ml-3 cursor-ew-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
      >
        <div className="w-4 h-8 bg-text-high rounded-full shadow-lg flex items-center justify-center text-bg-ink transform scale-75">
            <GripVertical size={12} />
        </div>
      </div>

      {/* Right Handle */}
      <div 
        {...bindRightResize()}
        className="absolute right-0 top-0 bottom-0 w-6 -mr-3 cursor-ew-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
      >
        <div className="w-4 h-8 bg-text-high rounded-full shadow-lg flex items-center justify-center text-bg-ink transform scale-75">
            <GripVertical size={12} />
        </div>
      </div>

      {/* Context Menu / Actions (visible on tap) */}
      {showControls && !isDragging && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-bg-charcoal text-text-high px-2 py-1 rounded-lg shadow-xl flex items-center gap-2 z-50 animate-in fade-in zoom-in duration-200">
              <button onClick={handleDelete} className="p-1 hover:text-red-400"><Trash2 size={14} /></button>
          </div>
      )}
    </div>
  );
};
