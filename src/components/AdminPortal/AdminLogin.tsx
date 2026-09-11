import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Lock, 
  User, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2,
  QrCode,
  Smartphone,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react';
import { authStore, MASTER_CREDENTIALS } from '../../utils/authStore';
import { AdminSession } from '../../types';

interface AdminLoginProps {
  onLoginSuccess: (session: AdminSession) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // MFA State
  const [step, setStep] = useState<'CREDENTIALS' | 'MFA'>('CREDENTIALS');
  const [mfaCode, setMfaCode] = useState<string>('');
  const [showQrEnrollment, setShowQrEnrollment] = useState<boolean>(false);
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);

  const mfaSecret = MASTER_CREDENTIALS.defaultMfaSecret;
  const otpauthUri = `otpauth://totp/Snack%20Box%20(N4X):${encodeURIComponent(username || 'Sreegeethesh')}?secret=${mfaSecret}&issuer=Snack%20Box%20(N4X)`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (step === 'CREDENTIALS') {
        const result = await authStore.login(username, password);
        setIsSubmitting(false);

        if (result.mfaRequired) {
          setStep('MFA');
          setError('');
          return;
        }

        if (result.success && result.session) {
          onLoginSuccess(result.session);
        } else {
          setError(result.error || 'Authentication failed. Please check your credentials.');
        }
      } else {
        // Step 2: MFA code verification
        if (!mfaCode || mfaCode.trim().length !== 6) {
          setIsSubmitting(false);
          setError('Please enter the 6-digit code from Google Authenticator.');
          return;
        }

        const result = await authStore.login(username, password, mfaCode);
        setIsSubmitting(false);

        if (result.success && result.session) {
          onLoginSuccess(result.session);
        } else {
          setError(result.error || 'Invalid 6-digit Authenticator code. Check your app.');
        }
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Login request error.');
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(mfaSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
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
            {step === 'MFA'
              ? 'Multi-Factor Authentication (MFA) • Master Admin Security'
              : 'Sign in to access Merchant KYC, Kitchen KDS, POS, or Revenue Analytics'}
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Database Initialized • Multi-Tenant Ready</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'CREDENTIALS' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin ID / Username</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. Sreegeethesh or admin_grand"
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
                  placeholder="Enter your account password"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-medium transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-neutral-800/80 text-center text-[11px] text-neutral-400">
                <span>Secure Multi-Tenant Gateway • Role-Based Access Control</span>
              </div>
            </form>
          ) : (
            /* Step 2: TOTP Multi-Factor Authentication */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs animate-fadeIn">
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-200/90 leading-relaxed">
                  <strong>Two-Factor Authentication:</strong> Enter the 6-digit verification code generated by <strong>Google Authenticator</strong> or <strong>Authy</strong> for your account.
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    <span>6-Digit Verification Code</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">RFC 6238 TOTP</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={mfaCode}
                  onChange={(e) => {
                    setMfaCode(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="000 000"
                  className="w-full bg-neutral-950 border border-amber-500/50 rounded-2xl px-4 py-3 text-white text-center text-xl font-mono tracking-widest placeholder-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-bold transition-all"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('CREDENTIALS');
                    setError('');
                  }}
                  className="px-4 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || mfaCode.length !== 6}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Verifying...' : 'Verify & Sign In'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>

              {/* Accordion to Setup / View Authenticator QR Code */}
              <div className="pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowQrEnrollment(!showQrEnrollment)}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-[11px] text-amber-400 font-medium flex items-center justify-between transition-colors border border-neutral-800 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQrEnrollment ? 'Hide Authenticator Setup' : 'Need to set up Google Authenticator?'}</span>
                  </span>
                  {showQrEnrollment ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showQrEnrollment && (
                  <div className="mt-3 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 animate-fadeIn">
                    <div className="text-[11px] text-neutral-400 text-center">
                      Scan this QR code using <strong>Google Authenticator</strong> or <strong>Authy</strong>:
                    </div>

                    <div className="flex justify-center p-3 bg-white rounded-xl w-fit mx-auto shadow-md">
                      <QRCodeSVG
                        value={otpauthUri}
                        size={150}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400">
                        <span>Secret Key (Manual Entry):</span>
                        <button
                          type="button"
                          onClick={handleCopySecret}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedSecret ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-amber-300 text-center tracking-wider select-all">
                        {mfaSecret}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-neutral-500">
          Snack Box • Powered by N4X Technologies
        </div>
      </div>
    </div>
  );
};

