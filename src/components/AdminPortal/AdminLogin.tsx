import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  Sparkles,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { authStore } from '../../utils/authStore';
import { AdminSession } from '../../types';

interface AdminLoginProps {
  onLoginSuccess: (session: AdminSession) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDemoHelp, setShowDemoHelp] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = authStore.login(username, password);
    setIsSubmitting(false);

    if (result.success && result.session) {
      onLoginSuccess(result.session);
    } else {
      setError(result.error || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleFillMaster = () => {
    setUsername('Sreegeethesh');
    setPassword('Sree@9345662166');
    setError('');
  };

  const handleFillTheaterAdmin = () => {
    setUsername('admin_snackbox');
    setPassword('admin@123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-4 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-neutral-900 border border-amber-500/30 text-2xl shadow-xl shadow-amber-500/10 mb-2">
            🍿
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Snack Box Admin Portal</h1>
          <p className="text-xs text-neutral-400">
            Sign in to access Merchant KYC, Kitchen KDS, or Revenue Analytics
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin ID</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="Enter Admin ID"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-medium transition-colors"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-medium transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Helpers */}
          <div className="pt-3 border-t border-neutral-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="font-semibold">Quick Demo Login Shortcuts:</span>
              <button
                onClick={() => setShowDemoHelp(!showDemoHelp)}
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{showDemoHelp ? 'Hide' : 'Info'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleFillMaster}
                className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-left transition-colors"
              >
                <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Master Admin</span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Sreegeethesh</div>
              </button>

              <button
                type="button"
                onClick={handleFillTheaterAdmin}
                className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-left transition-colors"
              >
                <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>Theater Staff</span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">admin_snackbox</div>
              </button>
            </div>

            {showDemoHelp && (
              <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400 space-y-1.5 animate-fadeIn">
                <p>
                  • <strong>Master Admin (<code className="text-amber-300 font-mono">Sreegeethesh</code>)</strong>: Dedicated view for Gateway monitoring, onboarding theaters &amp; KYC.
                </p>
                <p>
                  • <strong>Theater Staff (<code className="text-amber-300 font-mono">admin_snackbox</code>)</strong>: Theater operational view with Kitchen KDS, Menu Catalog, Revenue Analytics &amp; POS Printer.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-neutral-500">
          Snack Box • Multi-Merchant Cinema POS Architecture
        </div>
      </div>
    </div>
  );
};
