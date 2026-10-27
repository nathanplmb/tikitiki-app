import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../utils/audio';

interface MobileFrameWrapperProps {
  children: React.ReactNode;
}

export const MobileFrameWrapper: React.FC<MobileFrameWrapperProps> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start">
      {/* Discreet Audio Control (Top Right) */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleSound}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium backdrop-blur-xl transition-all border ${
            !isMuted
              ? 'bg-white/10 text-slate-200 border-white/15 shadow-sm'
              : 'bg-black/40 text-slate-400 border-white/5'
          }`}
          title="Effets sonores tactiles"
          aria-label="Contrôle audio"
        >
          {!isMuted ? <Volume2 className="w-3.5 h-3.5 text-slate-200" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          <span className="hidden sm:inline">{!isMuted ? 'Son tactile' : 'Muet'}</span>
        </button>
      </div>

      {/* Main Responsive Canvas: seamless on mobile, multi-column on desktop */}
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 lg:pl-72 transition-all">
        <div className="w-full min-h-screen relative flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};
