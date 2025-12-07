import React from 'react';
import { useProject } from './context/ProjectContext';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { Transport } from './components/Transport';
import { Upload } from 'lucide-react';
import logo from './assets/logo.png';

function App() {
  const { state, addTrackFromFile } = useProject();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        addTrackFromFile(file);
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-bg-ink text-text-high overflow-hidden select-none">
      <Header />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {state.tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-24 h-24 bg-bg-slate rounded-full flex items-center justify-center mb-4 shadow-lg shadow-accent-primary/20 animate-pulse overflow-hidden p-4">
              <img src={logo} alt="Jamigo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-text-high">Drop in your first jam</h2>
            <p className="text-text-dim max-w-xs">
              Import audio clips to start mixing your masterpiece.
            </p>
            <label className="cursor-pointer bg-accent-primary text-bg-ink font-bold py-4 px-8 rounded-2xl shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center gap-2">
              <Upload size={20} />
              <span>Import Audio</span>
              <input 
                type="file" 
                accept="audio/*,.m4a,audio/mp4,audio/x-m4a,audio/mpeg,audio/wav"
                multiple 
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <Timeline />
        )}
      </main>

      {state.tracks.length > 0 && <Transport />}
      
      {/* Global Drop Zone Overlay could go here */}
    </div>
  );
}

export default App;
