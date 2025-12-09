import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';
import type { Clip, Track, ProjectState, Action } from '../types';
import { getAudioContext, decodeAudio, getTrackHexColor, renderProject } from '../utils/audio';

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialState: ProjectState = {
  tracks: [],
  isPlaying: false,
  currentTime: 0,
  duration: 60,
  zoom: 50,
};

const projectReducer = (state: ProjectState, action: Action): ProjectState => {
  switch (action.type) {
    case 'ADD_TRACK':
      return { ...state, tracks: [...state.tracks, action.payload] };
    case 'ADD_CLIP':
      return {
        ...state,
        tracks: state.tracks.map(t => 
          t.id === action.payload.trackId 
            ? { ...t, clips: [...t.clips, action.payload] }
            : t
        )
      };
    case 'UPDATE_CLIP':
      return {
        ...state,
        tracks: state.tracks.map(t => ({
          ...t,
          clips: t.clips.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c)
        }))
      };
    case 'REMOVE_CLIP':
      return {
        ...state,
        tracks: state.tracks.map(t => ({
          ...t,
          clips: t.clips.filter(c => c.id !== action.payload.id)
        }))
      };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };
    case 'DELETE_TRACK':
      return { ...state, tracks: state.tracks.filter(t => t.id !== action.payload.id) };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    default:
      return state;
  }
};

interface ProjectContextType {
  state: ProjectState;
  dispatch: React.Dispatch<Action>;
  addTrackFromFile: (file: File) => Promise<void>;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  exportMix: () => Promise<void>;
  initializeAudio: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const activeSources = useRef<AudioBufferSourceNode[]>([]);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      stopAudio();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const initializeAudio = () => {
      // Force AudioContext to resume/unlock on user interaction
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
          ctx.resume();
      }
      // Create and play a silent buffer to fully unlock iOS audio
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
  };

  const stopAudio = () => {
    activeSources.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    activeSources.current = [];
  };

  const play = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    stopAudio();

    const startTime = ctx.currentTime;
    const offset = state.currentTime;
    startTimeRef.current = startTime - offset;

    state.tracks.forEach(track => {
      if (track.muted) return;
      track.clips.forEach(clip => {
        const clipEnd = clip.startTime + clip.duration;
        
        if (clipEnd > offset) {
            const source = ctx.createBufferSource();
            source.buffer = clip.buffer;
            source.connect(ctx.destination);

            let whenToStart = 0;
            let offsetInClip = 0;
            let durationToPlay = clip.duration;

            if (clip.startTime < offset) {
                whenToStart = 0;
                offsetInClip = (offset - clip.startTime) + clip.offset;
                durationToPlay = clip.duration - (offset - clip.startTime);
            } else {
                whenToStart = clip.startTime - offset;
                offsetInClip = clip.offset;
                durationToPlay = clip.duration;
            }
            
            source.start(startTime + whenToStart, offsetInClip, durationToPlay);
            activeSources.current.push(source);
        }
      });
    });

    dispatch({ type: 'SET_PLAYING', payload: true });

    const update = () => {
      const now = ctx.currentTime;
      const newTime = now - startTimeRef.current;
      
      if (newTime >= state.duration) {
        pause();
        dispatch({ type: 'SET_TIME', payload: state.duration });
      } else {
        dispatch({ type: 'SET_TIME', payload: newTime });
        animationFrameRef.current = requestAnimationFrame(update);
      }
    };
    animationFrameRef.current = requestAnimationFrame(update);
  };

  const pause = () => {
    stopAudio();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    dispatch({ type: 'SET_PLAYING', payload: false });
  };

  const seek = (time: number) => {
    const wasPlaying = state.isPlaying;
    if (wasPlaying) pause();
    dispatch({ type: 'SET_TIME', payload: time });
  };

  const addTrackFromFile = async (file: File) => {
    try {
      // Ensure audio context is ready when user interacts to import
      initializeAudio();
      
      const buffer = await decodeAudio(file);
      const trackId = generateId();
      const clipId = generateId();
      
      const newTrack: Track = {
        id: trackId,
        name: file.name.replace(/\.[^/.]+$/, ""),
        color: getTrackHexColor(state.tracks.length),
        clips: []
      };
      
      const newClip: Clip = {
        id: clipId,
        trackId: trackId,
        buffer: buffer,
        startTime: 0,
        offset: 0,
        duration: buffer.duration,
        name: file.name,
        totalDuration: buffer.duration
      };
      
      newTrack.clips.push(newClip);
      
      dispatch({ type: 'ADD_TRACK', payload: newTrack });
    } catch (error) {
      console.error("Failed to import audio", error);
      alert("Failed to import audio file.");
    }
  };

  const exportMix = async () => {
      try {
          const blob = await renderProject(state);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `jamigo-mix-${Date.now()}.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("Export failed", e);
          alert("Export failed. See console.");
      }
  };

  return (
    <ProjectContext.Provider value={{ state, dispatch, addTrackFromFile, play, pause, seek, exportMix, initializeAudio }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};
