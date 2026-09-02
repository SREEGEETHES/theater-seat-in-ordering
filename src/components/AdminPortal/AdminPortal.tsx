import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Utensils, 
  QrCode, 
  Layers, 
  Volume2, 
  VolumeX, 
  Film, 
  ShieldCheck, 
  Sparkles, 
  Printer, 
  Building2, 
  TrendingUp, 
  LogOut, 
  UserCheck,
  Lock
} from 'lucide-react';
import { KitchenView } from '../KitchenDashboard/KitchenView';
import { AdminMenuManager } from '../AdminMenuManager/AdminMenuManager';
import { SeatQRGenerator } from '../SeatQRGenerator/SeatQRGenerator';
import { ArchitectureBlueprint } from '../ArchitectureBlueprint/ArchitectureBlueprint';
import { PrinterSettings } from '../PrinterSettings/PrinterSettings';
import { MerchantOnboarding } from '../MerchantOnboarding/MerchantOnboarding';
import { RevenueAnalytics } from './RevenueAnalytics';
import { SeatLocation, AdminSession, Theater } from '../../types';
import { authStore } from '../../utils/authStore';
import { theaterStore } from '../../utils/theaterStore';

interface AdminPortalProps {
  currentSeat: SeatLocation;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSwitchToCustomerView: (seat?: SeatLocation) => void;
  activeOrdersCount: number;
  session: AdminSession;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentSeat,
  soundEnabled,
  onToggleSound,
  onSwitchToCustomerView,
  activeOrdersCount,
  session,
  onLogout,
}) => {
  const isMaster = session.role === 'MASTER_ADMIN';
  const isTheaterAdmin = session.role === 'THEATER_ADMIN';

  // Master Admin can ONLY see 'merchant'
  // Theater Admin can see 'kitchen', 'menu', 'revenue', 'printer', 'qr_studio'
  const [adminTab, setAdminTab] = useState<
    'kitchen' | 'menu' | 'revenue' | 'printer' | 'qr_studio' | 'merchant' | 'architecture'
  >(isMaster ? 'merchant' : 'kitchen');

  const [activeTheater, setActiveTheater] = useState<Theater>(theaterStore.getActiveTheater());

  useEffect(() => {
    const unsub = theaterStore.subscribe(() => {
      setActiveTheater(theaterStore.getActiveTheater());
    });
    return () => unsub();
  }, []);

  // Guarantee tab lock for master admin
  useEffect(() => {
    if (isMaster) {
      setAdminTab('merchant');
    }
  }, [isMaster]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-white select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Brand & Admin Role Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/20 border border-amber-500/40 text-amber-400">
              {isMaster ? <ShieldCheck className="w-5 h-5" /> : <Film className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">SNACK BOX</span>
                {isMaster ? (
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 shadow-sm flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>MASTER GATEWAY</span>
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>THEATER ADMIN</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                {isMaster 
                  ? `Signed in as Master: ${session.username} (Merchant Onboarding & PayU Management)` 
                  : `${activeTheater.name} • Signed in as ${session.username}`}
              </p>
            </div>
          </div>

          {/* Role-Specific Navigation Tabs */}
          <nav className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800/80 overflow-x-auto">
            {/* Master Admin ONLY has Merchant KYC tab */}
            {isMaster && (
              <button
                onClick={() => setAdminTab('merchant')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 ${
                  adminTab === 'merchant'
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Merchant KYC &amp; Onboarding</span>
              </button>
            )}

            {/* Theater Admin Tabs */}
            {isTheaterAdmin && (
              <>
                <button
                  onClick={() => setAdminTab('kitchen')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 relative ${
                    adminTab === 'kitchen'
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Kitchen KDS</span>
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
                  onClick={() => setAdminTab('revenue')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                    adminTab === 'revenue'
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Revenue Analytics</span>
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
                  <span>Thermal Printer</span>
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
                  <span>Armrest Stickers</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Tools: Audio Alert Toggle & Logout */}
          <div className="flex items-center gap-2">
            {isTheaterAdmin && (
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
            )}

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-950/50 hover:border-rose-500/40 border border-neutral-700 text-neutral-300 hover:text-rose-300 text-xs font-semibold transition-colors"
              title="Sign Out of Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Content View */}
      <main className="flex-1">
        {adminTab === 'merchant' && isMaster && (
          <MerchantOnboarding />
        )}

        {adminTab === 'kitchen' && isTheaterAdmin && (
          <KitchenView
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
          />
        )}

        {adminTab === 'menu' && isTheaterAdmin && (
          <AdminMenuManager />
        )}

        {adminTab === 'revenue' && isTheaterAdmin && (
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <RevenueAnalytics theater={activeTheater} />
          </div>
        )}

        {adminTab === 'printer' && isTheaterAdmin && (
          <PrinterSettings />
        )}

        {adminTab === 'qr_studio' && isTheaterAdmin && (
          <SeatQRGenerator
            onLoadSeatInCustomerApp={(seat) => {
              onSwitchToCustomerView(seat);
            }}
          />
        )}
      </main>
    </div>
  );
};
