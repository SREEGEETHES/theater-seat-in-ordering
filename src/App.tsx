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
import { theaterStore } from './utils/theaterStore';

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
        const theaterParam = urlParams.get('theater') || urlParams.get('theater_id');
        const adminParam = urlParams.get('admin');

        // Check hash parameters in case of hash-routing or hash query strings
        let hashParams = new URLSearchParams();
        if (hash.includes('?')) {
          hashParams = new URLSearchParams(hash.split('?')[1]);
        }
        const effectiveTheater = theaterParam || hashParams.get('theater') || hashParams.get('theater_id');
        const effectiveScreen = screenParam || hashParams.get('screen') || (hashParams.get('audi') ? `Audi ${hashParams.get('audi')}` : null);
        const effectiveRow = rowParam || hashParams.get('row');
        const effectiveSeat = seatParam || hashParams.get('seat');

        if (effectiveTheater) {
          theaterStore.setActiveTheaterId(effectiveTheater);
        }

        // Known valid paths
        const normalizedPath = path.replace(/\/$/, '') || '/';
        const validPaths = ['/', '/index.html', '/menu', '/order', '/admin'];
        const isRecognizedPath = validPaths.includes(normalizedPath);

        // Check for 404 routes or unrecognized paths
        if (!isRecognizedPath || normalizedPath === '/404' || hash === '#404' || hash === '#notfound') {
          setIs404View(true);
          setIsAdminView(false);
          return;
        }

        setIs404View(false);

        // If seat parameters exist (from mobile camera QR scan), ALWAYS open customer view for that seat
        if (effectiveScreen || effectiveRow || effectiveSeat || effectiveTheater) {
          setCurrentSeat((prev) => ({
            theater_id: effectiveTheater || prev.theater_id,
            screen: effectiveScreen || prev.screen || 'Audi 3',
            row: (effectiveRow || prev.row || 'F').toUpperCase(),
            seat: effectiveSeat || prev.seat || '12',
          }));
          setIsAdminView(false);
        } else if (normalizedPath === '/admin' || hash === '#admin' || adminParam === 'true') {
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

  const handleOpen404 = () => {
    setIs404View(true);
    setIsAdminView(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '#404');
    }
  };

  const handleSwitchToCustomerView = (seat?: SeatLocation) => {
    if (seat) {
      setCurrentSeat(seat);
      if (seat.theater_id) {
        theaterStore.setActiveTheaterId(seat.theater_id);
      }
    }
    setIs404View(false);
    setIsAdminView(false);
    if (typeof window !== 'undefined') {
      if (seat) {
        const params = new URLSearchParams();
        params.set('screen', seat.screen);
        params.set('row', seat.row);
        params.set('seat', seat.seat);
        if (seat.theater_id) {
          params.set('theater', seat.theater_id);
        }
        window.history.pushState({}, '', `/?${params.toString()}`);
      } else {
        window.history.pushState({}, '', '/');
      }
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
              onOpen404={handleOpen404}
            />
          </main>
        </>
      )}
    </div>
  );
}
