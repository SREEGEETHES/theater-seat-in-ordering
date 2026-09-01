import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  Smartphone, 
  Sparkles, 
  Lock, 
  AlertCircle,
  Building2,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order } from '../../types';
import { 
  SUPPORTED_UPI_APPS, 
  generateUPIIntentUri, 
  THEATER_VPA, 
  THEATER_NAME, 
  getZeroMdrGatewayPayload 
} from '../../utils/upi';
import { orderStore } from '../../utils/storage';
import { printerStore } from '../../utils/printerStore';
import { soundManager } from '../../utils/audio';

interface UPIPaymentModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onPaymentSuccess: (order: Order) => void;
}

const DEMO_PIN = '1010';

export const UPIPaymentModal: React.FC<UPIPaymentModalProps> = ({
  isOpen,
  order,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedApp, setSelectedApp] = useState<string>('gpay');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pinStep, setPinStep] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 mins countdown

  useEffect(() => {
    if (!isOpen) {
      setPinStep(false);
      setEnteredPin('');
      setPinError('');
      setIsProcessing(false);
      setTimeLeft(300);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Physical keyboard listener for PIN entry
  useEffect(() => {
    if (!isOpen || !pinStep || isProcessing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (enteredPin.length < 4) {
          setPinError('');
          setEnteredPin((prev) => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPinError('');
        setEnteredPin((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        if (enteredPin === DEMO_PIN) {
          executePayment();
        } else if (enteredPin.length === 4) {
          setPinError(`Incorrect PIN. Demo passcode is ${DEMO_PIN}`);
        } else {
          setPinError(`Please enter 4-digit demo PIN (${DEMO_PIN})`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pinStep, enteredPin, isProcessing]);

  if (!isOpen || !order) return null;

  const upiIntentUri = generateUPIIntentUri(order);
  const gatewayPayload = getZeroMdrGatewayPayload(order);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSimulatePayment = (appName?: string) => {
    setIsProcessing(false);
    setPinError('');
    setEnteredPin('');
    setPinStep(true);
  };

  const handleAutoFillAndPay = () => {
    setEnteredPin(DEMO_PIN);
    setPinError('');
    executePayment();
  };

  const executePayment = () => {
    setIsProcessing(true);
    setPinError('');

    // Play chime sound
    soundManager.playNewOrderChime();

    // Simulate NPCI instant settlement & webhook trigger
    setTimeout(() => {
      const txnId = `NPCI${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const updatedOrder = orderStore.markOrderAsPaidViaWebhook(order.order_id, txnId);

      setIsProcessing(false);
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });

      if (updatedOrder) {
        // Automatically fire receipt to kitchen counter thermal printer
        printerStore.dispatchPrintJob(updatedOrder).catch((err) => {
          console.warn('[Auto-Printer] Dispatch log:', err);
        });
        onPaymentSuccess(updatedOrder);
      } else {
        const finalOrder: Order = { ...order, payment_status: 'PAID', upi_txn_id: txnId };
        printerStore.dispatchPrintJob(finalOrder).catch((err) => {
          console.warn('[Auto-Printer] Dispatch log:', err);
        });
        onPaymentSuccess(finalOrder);
      }
    }, 900);
  };

  const handleCompletePinPayment = () => {
    if (enteredPin === DEMO_PIN) {
      executePayment();
    } else if (enteredPin.length === 0) {
      setPinError(`Please enter demo PIN: ${DEMO_PIN}`);
    } else {
      setPinError(`Incorrect PIN. Demo passcode is ${DEMO_PIN}`);
    }
  };

  const isPinValid = enteredPin === DEMO_PIN;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-5 sm:p-6 text-neutral-100 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">0% MDR UPI Pay</h3>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                  Demo Session
                </span>
              </div>
              <p className="text-xs text-neutral-400">Order {order.order_id} • Token #{order.token_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Hero */}
        <div className="mt-4 p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 text-center">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
            Total Amount Due
          </span>
          <div className="text-3xl font-extrabold text-white mt-0.5 flex items-center justify-center gap-1">
            <span className="text-amber-400">₹</span>
            <span>{order.total_amount.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-neutral-400">
            <div className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-neutral-500" />
              <span>To: <strong className="text-neutral-200">{THEATER_VPA}</strong></span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 text-amber-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Demo Mode Notice */}
        <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Demo Passcode / UPI PIN: <strong className="font-mono text-white text-sm bg-neutral-950 px-1.5 py-0.5 rounded border border-amber-500/40">1010</strong></span>
          </div>
          <button
            onClick={() => {
              setEnteredPin(DEMO_PIN);
              setPinError('');
              setPinStep(true);
            }}
            className="text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 px-2 py-1 rounded-lg transition-colors shrink-0"
          >
            Auto 1010
          </button>
        </div>

        {!pinStep ? (
          <>
            {/* Supported UPI Apps Picker */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Choose UPI App (Tap to test PIN screen)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SUPPORTED_UPI_APPS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      setSelectedApp(app.id);
                      handleSimulatePayment(app.name);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedApp === app.id
                        ? 'bg-neutral-800 border-amber-500/50 shadow-sm'
                        : 'bg-neutral-950/60 border-neutral-800 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                        {app.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          <span>{app.name}</span>
                          {app.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-medium">
                              {app.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400">Direct Savings/Current Account (0% MDR)</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop / In-Person QR Code Fallback */}
            <div className="mt-4 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 mb-2">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Or Scan QR with any Phone UPI App</span>
              </div>
              <div className="bg-white p-3 rounded-xl inline-block shadow-lg mx-auto">
                <QRCodeSVG
                  value={upiIntentUri}
                  size={130}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="mt-2 text-[11px] text-neutral-400 font-mono truncate px-2">
                {upiIntentUri}
              </div>
            </div>

            {/* Instant Fast Pay Demo Button */}
            <div className="mt-4">
              <button
                onClick={handleAutoFillAndPay}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Instant Demo Pay with PIN 1010</span>
              </button>
            </div>
          </>
        ) : (
          /* Simulated UPI PIN Entry screen */
          <div className="mt-4 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Enter Demo UPI PIN: 1010</h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Authorizing ₹{order.total_amount.toFixed(2)} to {THEATER_NAME}
            </p>

            {/* Simulated PIN input circles */}
            <div className="flex justify-center gap-3 my-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    enteredPin.length > i
                      ? isPinValid
                        ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                        : 'bg-amber-400 border-amber-400 scale-110 shadow-sm shadow-amber-400/50'
                      : 'bg-neutral-800 border-neutral-700'
                  }`}
                />
              ))}
            </div>

            {/* PIN Error Message if any */}
            {pinError && (
              <div className="mb-3 p-2 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Quick Fill Demo PIN 1010 Pill */}
            <div className="mb-3 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setEnteredPin(DEMO_PIN);
                  setPinError('');
                }}
                className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold transition-all flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Fill Demo PIN: 1010</span>
              </button>
            </div>

            {/* Virtual Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto my-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (enteredPin.length < 4) {
                      setPinError('');
                      setEnteredPin((prev) => prev + num);
                    }
                  }}
                  className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 border border-neutral-800 text-base font-bold text-white transition-colors cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setEnteredPin('');
                  setPinError('');
                }}
                className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 border border-neutral-800 text-xs font-semibold text-neutral-400 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  if (enteredPin.length < 4) {
                    setPinError('');
                    setEnteredPin((prev) => prev + '0');
                  }
                }}
                className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 border border-neutral-800 text-base font-bold text-white cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  setPinError('');
                  setEnteredPin((prev) => prev.slice(0, -1));
                }}
                className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 border border-neutral-800 text-xs font-semibold text-neutral-400 cursor-pointer"
              >
                Del
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPinStep(false);
                  setPinError('');
                  setEnteredPin('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCompletePinPayment}
                disabled={isProcessing}
                className={`flex-1 py-2.5 rounded-xl text-neutral-950 text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isPinValid
                    ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/25 ring-2 ring-emerald-400'
                    : 'bg-amber-500 hover:bg-amber-400'
                } disabled:opacity-50`}
              >
                {isProcessing ? (
                  <span>Settling via Bank Webhook...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize Payment (₹{order.total_amount.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

