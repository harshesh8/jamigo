import type { ProjectState } from '../types';

// ... (existing code) ...

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const TRACK_COLORS = [
  'bg-track-pink',
  'bg-track-blue',
  'bg-track-yellow',
  'bg-track-orange',
  'bg-track-purple',
  'bg-track-lime',
  'bg-track-teal',
  'bg-track-coral',
];

export const HEX_COLORS = [
  '#FF66D4',
  '#52D0FF',
  '#FFD75A',
  '#FF8A4F',
  '#9A5BFF',
  '#C9FF6A',
  '#4BFAC9',
  '#FF5C7A',
];

export const getTrackColor = (index: number) => {
  return TRACK_COLORS[index % TRACK_COLORS.length];
};

export const getTrackHexColor = (index: number) => {
  return HEX_COLORS[index % HEX_COLORS.length];
};

// Audio Context Singleton
let audioContext: AudioContext | null = null;

export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const decodeAudio = async (file: File): Promise<AudioBuffer> => {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
};

// WAV Encoder
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const encodeWAV = (samples: Float32Array, sampleRate: number) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM (integer)
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
};

export const renderProject = async (state: ProjectState): Promise<Blob> => {
  const ctx = new OfflineAudioContext(
    2, // Stereo
    state.duration * 44100,
    44100
  );

  state.tracks.forEach(track => {
    if (track.muted) return;
    
    track.clips.forEach(clip => {
      const source = ctx.createBufferSource();
      source.buffer = clip.buffer;
      source.connect(ctx.destination);
      
      // Scheduling
      // source.start(when, offset, duration)
      source.start(clip.startTime, clip.offset, clip.duration);
    });
  });

  const renderedBuffer = await ctx.startRendering();
  
  // Mix down to mono for simple WAV encoder above, or update encoder for stereo.
  // Let's update encoder to handle stereo if needed, but for now, let's just take the first channel or mix them.
  // Actually, the WAV encoder above is Mono (1 channel).
  // Let's mix down to mono for simplicity or update encoder.
  // Mixing down: (L+R)/2
  
  const l = renderedBuffer.getChannelData(0);
  const r = renderedBuffer.getChannelData(1);
  const mono = new Float32Array(l.length);
  for(let i=0; i<l.length; i++) {
      mono[i] = (l[i] + r[i]) / 2;
  }

  return encodeWAV(mono, 44100);
};
