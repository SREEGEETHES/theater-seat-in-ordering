import React from 'react';
import { Film, Home, ArrowLeft, Search, Utensils, ShieldCheck, RefreshCw } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';

interface NotFoundPageProps {
  onGoHome: () => void;
  onGoAdmin?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome, onGoAdmin }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-8 relative selection:bg-amber-500 selection:text-neutral-950">
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Breadcrumbs */}
      <div className="max-w-4xl mx-auto w-full relative z-10">
        <Breadcrumbs
          items={[
            { label: 'Cinema Dining', onClick: onGoHome },
            { label: '404 - Page Not Found' }
          ]}
        />
      </div>

      {/* Main 404 Content */}
      <main className="max-w-xl mx-auto w-full my-auto text-center space-y-6 relative z-10 py-12">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-neutral-900 border border-amber-500/30 text-5xl shadow-2xl shadow-amber-500/10 mx-auto animate-pulse">
          🍿
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
            ERROR 404 • SEAT NOT FOUND
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Lost in the Theater?
          </h1>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            The seat QR link or cinema portal page you requested does not exist or has moved. Let's get you back to your movie snacks.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onGoHome}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Utensils className="w-4 h-4" />
            <span>Order Snacks at Seat F-12</span>
          </button>

          {onGoAdmin && (
            <button
              type="button"
              onClick={onGoAdmin}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin &amp; Kitchen Login</span>
            </button>
          )}
        </div>

        <div className="pt-6 border-t border-neutral-900 text-xs text-neutral-500 flex items-center justify-center gap-4">
          <span>Snack Box In-Seat Cinema POS</span>
          <span>•</span>
          <span>0% MDR UPI Direct Settlement</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-neutral-600 py-4">
        &copy; {new Date().getFullYear()} Snack Box Entertainment Inc. All rights reserved.
      </footer>
    </div>
  );
};
