import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerView } from './components/CustomerApp/CustomerView';
import { AdminPortal } from './components/AdminPortal/AdminPortal';
import { AdminLogin } from './components/AdminPortal/AdminLogin';
import { NotFoundPage } from './components/NotFoundPage';
import { SeatLocation, AdminSession } from './types';
import { orderStore } from './utils/storage';
import { soundManager } from './utils/audio';
import { authStore } from './utils/authStore';

export default function App() {
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [is404View, setIs404View] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);
  const [session, setSession] = useState<AdminSession | null>(authStore.getSession());

  // Default seat location (Audi 3, Row F, Seat 12)
  const [currentSeat, setCurrentSeat] = useState<SeatLocation>({
    screen: 'Audi 3',
    row: 'F',
    seat: '12',
  });

  // Subscribe to auth session changes
  useEffect(() => {
    const unsub = authStore.subscribe((s) => {
      setSession(s);
    });
    return () => unsub();
  }, []);

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

        // Check for 404 routes
        if (path === '/404' || hash === '#404') {
          setIs404View(true);
          setIsAdminView(false);
          return;
        }

        setIs404View(false);

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

  // Update dynamic page title
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (is404View) {
        document.title = '404 - Page Not Found | Snack Box';
      } else if (isAdminView) {
        if (!session) {
          document.title = 'Staff & Admin Login | Snack Box Cinema Portal';
        } else if (session.role === 'MASTER_ADMIN') {
          document.title = 'Master Gateway Control & KYC | Snack Box';
        } else {
          document.title = `${session.theaterName || 'Theater'} - Kitchen KDS & POS | Snack Box`;
        }
      } else {
        document.title = `Snack Box - In-Seat Dining (${currentSeat.screen}, Row ${currentSeat.row}, Seat ${currentSeat.seat})`;
      }
    }
  }, [is404View, isAdminView, session, currentSeat]);

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

  const handleOpenAdmin = () => {
    setIs404View(false);
    setIsAdminView(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '#admin');
    }
  };

  const handleSwitchToCustomerView = (seat?: SeatLocation) => {
    if (seat) {
      setCurrentSeat(seat);
    }
    setIs404View(false);
    setIsAdminView(false);
    if (typeof window !== 'undefined') {
      const targetUrl = seat
        ? `?screen=${encodeURIComponent(seat.screen)}&row=${seat.row}&seat=${seat.seat}`
        : window.location.pathname;
      window.history.pushState({}, '', targetUrl);
    }
  };

  const handleLogout = () => {
    authStore.logout();
  };

  if (is404View) {
    return (
      <NotFoundPage
        onGoHome={() => handleSwitchToCustomerView({ screen: 'Audi 3', row: 'F', seat: '12' })}
        onGoAdmin={handleOpenAdmin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {isAdminView ? (
        session ? (
          /* Logged In Admin Portal with Role-Based Tabs (Master vs Theater Admin) */
          <AdminPortal
            currentSeat={currentSeat}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onSwitchToCustomerView={handleSwitchToCustomerView}
            activeOrdersCount={activeOrdersCount}
            session={session}
            onLogout={handleLogout}
          />
        ) : (
          /* Login Screen for Admin Portal */
          <AdminLogin onLoginSuccess={(newSession) => setSession(newSession)} />
        )
      ) : (
        /* Customer View (Pure customer dining & ordering interface) */
        <>
          <Navbar
            currentSeat={currentSeat}
            onOpenAdmin={handleOpenAdmin}
          />

          <main className="flex-1">
            <CustomerView
              currentSeat={currentSeat}
              onOpenAdmin={handleOpenAdmin}
            />
          </main>
        </>
      )}
    </div>
  );
}
