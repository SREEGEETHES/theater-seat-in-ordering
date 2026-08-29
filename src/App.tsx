import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerView } from './components/CustomerApp/CustomerView';
import { AdminPortal } from './components/AdminPortal/AdminPortal';
import { SeatSelectorModal } from './components/SeatSelectorModal';
import { SeatLocation } from './types';
import { orderStore } from './utils/storage';
import { soundManager } from './utils/audio';

export default function App() {
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSeatSelectorOpen, setIsSeatSelectorOpen] = useState<boolean>(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  // Default seat location (matches prompt example: Audi 3, Row F, Seat 12)
  const [currentSeat, setCurrentSeat] = useState<SeatLocation>({
    screen: 'Audi 3',
    row: 'F',
    seat: '12',
  });

  // URL parsing for route & seat parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkRoute = () => {
        const path = window.location.pathname;
        const hash = window.location.hash;
        const search = window.location.search;
        const urlParams = new URLSearchParams(search);

        const screenParam = urlParams.get('screen') || (urlParams.get('audi') ? `Audi ${urlParams.get('audi')}` : null);
        const rowParam = urlParams.get('row');
        const seatParam = urlParams.get('seat');
        const adminParam = urlParams.get('admin');

        // If seat parameters exist (from mobile camera QR scan), ALWAYS open customer view for that seat
        if (screenParam || rowParam || seatParam) {
          setCurrentSeat({
            screen: screenParam || 'Audi 3',
            row: rowParam || 'F',
            seat: seatParam || '12',
          });
          setIsAdminView(false);
        } else if (path.includes('/admin') || hash === '#admin' || adminParam === 'true') {
          setIsAdminView(true);
        }
      };

      checkRoute();
      window.addEventListener('popstate', checkRoute);
      window.addEventListener('hashchange', checkRoute);
      return () => {
        window.removeEventListener('popstate', checkRoute);
        window.removeEventListener('hashchange', checkRoute);
      };
    }
  }, []);

  // Update active orders count badge
  useEffect(() => {
    const updateCount = () => {
      const orders = orderStore.getOrders();
      const pendingCount = orders.filter(
        (o) => o.payment_status === 'PAID' && o.progress_status !== 'DELIVERED'
      ).length;
      setActiveOrdersCount(pendingCount);
    };

    updateCount();
    const unsubscribe = orderStore.subscribe(updateCount);
    return () => unsubscribe();
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  };

  const handleSelectSeat = (newSeat: SeatLocation) => {
    setCurrentSeat(newSeat);
  };

  const handleOpenAdmin = () => {
    setIsAdminView(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '#admin');
    }
  };

  const handleSwitchToCustomerView = (seat?: SeatLocation) => {
    if (seat) {
      setCurrentSeat(seat);
    }
    setIsAdminView(false);
    if (typeof window !== 'undefined') {
      const targetUrl = seat
        ? `?screen=${encodeURIComponent(seat.screen)}&row=${seat.row}&seat=${seat.seat}`
        : window.location.pathname;
      window.history.pushState({}, '', targetUrl);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {isAdminView ? (
        /* Admin View Portal with Kitchen KDS, Menu Management, Seat Armrest Sticker Studio & Architecture */
        <AdminPortal
          currentSeat={currentSeat}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onSwitchToCustomerView={handleSwitchToCustomerView}
          activeOrdersCount={activeOrdersCount}
        />
      ) : (
        /* Customer View (Pure customer dining & ordering interface) */
        <>
          <Navbar
            currentSeat={currentSeat}
            onOpenSeatSelector={() => setIsSeatSelectorOpen(true)}
            onOpenAdmin={handleOpenAdmin}
          />

          <main className="flex-1">
            <CustomerView
              currentSeat={currentSeat}
              onOpenSeatSelector={() => setIsSeatSelectorOpen(true)}
            />
          </main>
        </>
      )}

      {/* Seat Selection & QR Scan Simulator Modal */}
      <SeatSelectorModal
        isOpen={isSeatSelectorOpen}
        onClose={() => setIsSeatSelectorOpen(false)}
        currentSeat={currentSeat}
        onSelectSeat={handleSelectSeat}
      />
    </div>
  );
}
