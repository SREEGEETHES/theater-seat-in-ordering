import React, { useState, useEffect } from 'react';
import { 
  Film, 
  MapPin,
  UtensilsCrossed
} from 'lucide-react';
import { SeatLocation, Theater } from '../types';
import { theaterStore } from '../utils/theaterStore';

interface NavbarProps {
  currentSeat: SeatLocation;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSeat,
}) => {
  const [activeTheater, setActiveTheater] = useState<Theater>(theaterStore.getActiveTheater());

  useEffect(() => {
    const unsub = theaterStore.subscribe(() => {
      setActiveTheater(theaterStore.getActiveTheater());
    });
    return () => unsub();
  }, []);

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-white select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Snack Box Brand Header - Acts as Home Link */}
        <button
          onClick={handleGoHome}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          title="Snack Box - Home"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-tight text-white group-hover:text-amber-400 transition-colors">
                SNACK BOX
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Powered by N4X
            </p>
          </div>
        </button>

        {/* Right Tools: Current Locked Seat Pill */}
        <div className="flex items-center gap-2">
          {/* Active Scanned Seat Indicator */}
          <div
            id="badge-active-seat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-semibold shadow-inner"
            title="Armrest Scanned Seat"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-neutral-400 font-normal">Seat:</span>
            <span className="text-amber-400 font-bold">{currentSeat.screen} • {currentSeat.row}{currentSeat.seat}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
