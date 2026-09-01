import React from 'react';
import { 
  Film, 
  MapPin,
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Sparkles
} from 'lucide-react';
import { SeatLocation } from '../types';

interface NavbarProps {
  currentSeat: SeatLocation;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSeat,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-white select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Cinema Dining Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-tight text-white">GRAND CINEPLEX</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                0% MDR UPI
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">In-Seat Cinema Dining & Fresh Snacks</p>
          </div>
        </div>

        {/* Right Tools: Current Locked Seat Pill & Admin Switch */}
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

          {/* Discreet Admin Portal Link */}
          <button
            id="btn-open-admin-portal"
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
            title="Access Staff Kitchen KDS, Menu Management & Armrest Sticker Studio (/admin)"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Admin / Kitchen Portal</span>
            <span className="md:hidden">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
