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
  Building2
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

interface UPIPaymentModalProps {

  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onPaymentSuccess: (order: Order) => void;
}

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
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 mins countdown

  useEffect(() => {
    if (!isOpen) {
      setPinStep(false);
      setEnteredPin('');
      setIsProcessing(false);
      setTimeLeft(300);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const upiIntentUri = generateUPIIntentUri(order);
  const gatewayPayload = getZeroMdrGatewayPayload(order);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSimulatePayment = (appName?: string) => {
    setIsProcessing(true);
    setPinStep(true);
  };

  const handleCompletePinPayment = () => {
    setIsProcessing(true);

    // Simulate NPCI instant settlement & webhook trigger
    setTimeout(() => {
      const txnId = `NPCI${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const updatedOrder = orderStore.markOrderAsPaidViaWebhook(order.order_id, txnId);

      setIsProcessing(false);
      confetti({
        particleCount: 80,
        spread: 70,
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
                  Direct Bank
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

        {/* 0% MDR Zero-Fee Guarantee Badge */}
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">0% Fee Direct Bank Settlement</span>
            <span className="text-[11px] text-emerald-400/90 leading-tight block">
              Bypasses RuPay credit lines and wallets. Settles directly via NPCI bank rails at ₹0 MDR.
            </span>
          </div>
        </div>

        {!pinStep ? (
          <>
            {/* Supported UPI Apps Picker */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Choose UPI App (Instant Deep-link)
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
                        <span className="text-[11px] text-neutral-400">Direct Savings/Current Account</span>
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
                  size={140}
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
                onClick={() => handleSimulatePayment('GPay')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simulate Instant UPI PIN & Webhook Approval</span>
              </button>
            </div>
          </>
        ) : (
          /* Simulated UPI PIN Entry screen */
          <div className="mt-4 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Enter 4 or 6 Digit UPI PIN</h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Authorizing ₹{order.total_amount.toFixed(2)} to {THEATER_NAME}
            </p>

            {/* Simulated PIN input circles */}
            <div className="flex justify-center gap-3 my-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    enteredPin.length > i
                      ? 'bg-amber-400 border-amber-400 scale-110 shadow-sm shadow-amber-400/50'
                      : 'bg-neutral-800 border-neutral-700'
                  }`}
                />
              ))}
            </div>

            {/* Virtual Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto my-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (enteredPin.length < 4) {
                      setEnteredPin((prev) => prev + num);
                    }
                  }}
                  className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-base font-bold text-white transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setEnteredPin('')}
                className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-400"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  if (enteredPin.length < 4) {
                    setEnteredPin((prev) => prev + '0');
                  }
                }}
                className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-base font-bold text-white"
              >
                0
              </button>
              <button
                onClick={() => setEnteredPin((prev) => prev.slice(0, -1))}
                className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-400"
              >
                Del
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setPinStep(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
              >
                Back
              </button>
              <button
                onClick={handleCompletePinPayment}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <span>Settling via NPCI...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize Payment</span>
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
