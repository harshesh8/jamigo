export interface Clip {
  id: string;
  trackId: string;
  buffer: AudioBuffer;
  startTime: number; // When the clip starts in the timeline (seconds)
  offset: number;    // Start offset within the source audio file (seconds)
  duration: number;  // Duration of the clip used (seconds)
  name: string;
  totalDuration: number; // Total duration of the source file
}

export interface Track {
  id: string;
  name: string;
  color: string;
  clips: Clip[];
  muted?: boolean;
  solo?: boolean;
}

export interface ProjectState {
  tracks: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number; // Total project duration
  zoom: number; // Pixels per second
}

export type Action =
  | { type: 'ADD_TRACK'; payload: Track }
  | { type: 'ADD_CLIP'; payload: Clip }
  | { type: 'UPDATE_CLIP'; payload: Partial<Clip> & { id: string } }
  | { type: 'REMOVE_CLIP'; payload: { id: string } }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'DELETE_TRACK'; payload: { id: string } }
  | { type: 'SET_DURATION'; payload: number };

