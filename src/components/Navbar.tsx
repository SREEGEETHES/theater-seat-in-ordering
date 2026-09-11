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

  const currentTheater = (currentSeat.theater_id ? theaterStore.getTheaterById(currentSeat.theater_id) : null) || activeTheater;

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
            <p className="text-xs text-amber-400/90 font-medium truncate max-w-[170px] sm:max-w-xs">
              {currentTheater?.name || 'Powered by N4X'}
            </p>
          </div>
        </button>

        {/* Right Tools: Current Locked Seat Pill */}
        <div className="flex items-center gap-2">
          {/* Active Scanned Seat Indicator */}
          <div
            id="badge-active-seat"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-amber-500/30 text-neutral-100 text-xs font-semibold shadow-sm transition-all hover:border-amber-500/60"
            title="Armrest QR Scanned Location"
          >
            <div className="relative flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <div className="flex items-center gap-1">
              <span className="hidden md:inline text-neutral-400 font-normal">Seat:</span>
              <span className="text-amber-400 font-bold tracking-wide">
                {currentSeat.screen} • {currentSeat.row}{currentSeat.seat}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
