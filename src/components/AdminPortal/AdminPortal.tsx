import React, { useState } from 'react';
import { 
  ChefHat, 
  Utensils, 
  QrCode, 
  Layers, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Film, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Printer
} from 'lucide-react';
import { KitchenView } from '../KitchenDashboard/KitchenView';
import { AdminMenuManager } from '../AdminMenuManager/AdminMenuManager';
import { SeatQRGenerator } from '../SeatQRGenerator/SeatQRGenerator';
import { ArchitectureBlueprint } from '../ArchitectureBlueprint/ArchitectureBlueprint';
import { PrinterSettings } from '../PrinterSettings/PrinterSettings';
import { SeatLocation } from '../../types';

interface AdminPortalProps {
  currentSeat: SeatLocation;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSwitchToCustomerView: (seat?: SeatLocation) => void;
  activeOrdersCount: number;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentSeat,
  soundEnabled,
  onToggleSound,
  onSwitchToCustomerView,
  activeOrdersCount,
}) => {
  const [adminTab, setAdminTab] = useState<'kitchen' | 'menu' | 'printer' | 'qr_studio' | 'architecture'>('kitchen');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-white select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Brand & Admin Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">CINESNACK</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 shadow-sm">
                  ADMIN CONSOLE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">Theater Management, Kitchen KDS & Sticker Studio</p>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <nav className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800/80 overflow-x-auto">
            <button
              onClick={() => setAdminTab('kitchen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 relative ${
                adminTab === 'kitchen'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Kitchen & Counter (KDS)</span>
              {activeOrdersCount > 0 && (
                <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ml-0.5 ${
                  adminTab === 'kitchen' ? 'bg-neutral-950 text-amber-400' : 'bg-amber-500 text-neutral-950'
                }`}>
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminTab('menu')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                adminTab === 'menu'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Menu Catalog</span>
            </button>

            <button
              onClick={() => setAdminTab('printer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                adminTab === 'printer'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>POS & Thermal Printer</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>

            <button
              onClick={() => setAdminTab('qr_studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                adminTab === 'qr_studio'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Seat Armrest Stickers</span>
            </button>

            <button
              onClick={() => setAdminTab('architecture')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                adminTab === 'architecture'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">0% MDR & Architecture</span>
              <span className="md:hidden">Specs</span>
            </button>
          </nav>

          {/* Right Tools: Customer View Switch & Audio Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSwitchToCustomerView(currentSeat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
              title="Open Customer Ordering View"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Launch Customer View</span>
            </button>

            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
              }`}
              title={soundEnabled ? 'Kitchen Sound Alerts: ON' : 'Kitchen Sound Alerts: OFF'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Admin Content View */}
      <main className="flex-1">
        {adminTab === 'kitchen' && (
          <KitchenView
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
          />
        )}

        {adminTab === 'menu' && (
          <AdminMenuManager />
        )}

        {adminTab === 'printer' && (
          <PrinterSettings />
        )}

        {adminTab === 'qr_studio' && (
          <SeatQRGenerator
            onLoadSeatInCustomerApp={(seat) => {
              onSwitchToCustomerView(seat);
            }}
          />
        )}

        {adminTab === 'architecture' && (
          <ArchitectureBlueprint />
        )}
      </main>
    </div>
  );
};

