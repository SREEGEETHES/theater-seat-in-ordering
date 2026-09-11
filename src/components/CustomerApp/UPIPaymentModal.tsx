import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheck, 
  Clock, 
  X, 
  Smartphone, 
  Lock, 
  RefreshCw, 
  ExternalLink, 
  Zap, 
  Check, 
  ChevronRight,
  Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, PayUPaymentResponse } from '../../types';
import { orderStore } from '../../utils/storage';
import { printerStore } from '../../utils/printerStore';
import { theaterStore } from '../../utils/theaterStore';
import { soundManager } from '../../utils/audio';
import { analyticsStore } from '../../utils/analyticsStore';
import { 
  UpiLogo, 
  GooglePayLogo, 
  PhonePeLogo, 
  PaytmLogo, 
  BhimLogo, 
  CredLogo 
} from './UpiBrandIcons';

interface UPIPaymentModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onPaymentSuccess: (order: Order) => void;
}

const UPI_APPS = [
  { 
    id: 'gpay', 
    name: 'Google Pay', 
    subtitle: 'Direct GPay UPI',
    icon: <GooglePayLogo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />,
    badge: 'Popular',
  },
  { 
    id: 'phonepe', 
    name: 'PhonePe', 
    subtitle: 'Instant Bank Pay',
    icon: <PhonePeLogo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />,
    badge: 'Fastest',
  },
  { 
    id: 'paytm', 
    name: 'Paytm', 
    subtitle: 'Paytm UPI / Bank',
    icon: <PaytmLogo className="w-6 h-6 shrink-0" />,
  },
  { 
    id: 'cred', 
    name: 'CRED', 
    subtitle: 'CRED UPI & Coins',
    icon: <CredLogo className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />,
  },
];

export const UPIPaymentModal: React.FC<UPIPaymentModalProps> = ({
  isOpen,
  order,
  onClose,
  onPaymentSuccess,
}) => {
  const [payuData, setPayuData] = useState<PayUPaymentResponse | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState<boolean>(true);
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 mins countdown

  const currentTheater = order?.theater_id 
    ? theaterStore.getTheaterById(order.theater_id) || theaterStore.getActiveTheater()
    : theaterStore.getActiveTheater();

  // Reset states when opening
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(300);
    }
  }, [isOpen]);

  // Auto-close modal when timer hits 00:00 (returns to user page)
  useEffect(() => {
    if (isOpen && timeLeft <= 0) {
      onClose();
    }
  }, [timeLeft, isOpen, onClose]);

  // Initialize server-side PayU transaction
  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !order) return;

    async function initPayUPayment() {
      try {
        setIsLoadingPayment(true);
        const res = await fetch('/api/payu/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theater_id: order?.theater_id || currentTheater.theater_id,
            order_id: order?.order_id,
            amount: order?.total_amount,
            productinfo: `Cinema Snacks Order ${order?.order_id}`,
            firstname: order?.customer_name || 'Guest',
            email: 'guest@snackbox.in',
            phone: order?.customer_phone || '9999999999',
            screen_number: order?.screen_number || 'Audi 3',
            seat_location: order?.seat_location || 'F-12',
            delivery_mode: order?.delivery_mode || 'SEAT_SERVICE',
            token_number: order?.token_number || 84,
          }),
        });

        const data = await res.json();
        if (isMounted && data.success) {
          setPayuData(data);
        }
      } catch (err) {
        console.error('PayU Payment creation error:', err);
      } finally {
        if (isMounted) {
          setIsLoadingPayment(false);
        }
      }
    }

    initPayUPayment();

    // 5-minute countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isOpen, order]);

  // Subscribe to order store updates (e.g. when Webhook confirms payment via SSE or Cloud)
  useEffect(() => {
    if (!isOpen || !order) return;

    const unsubscribe = orderStore.subscribe(() => {
      const liveOrder = orderStore.getOrderById(order.order_id);
      if (liveOrder && liveOrder.payment_status === 'PAID') {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        });
        soundManager.playNewOrderChime();
        onPaymentSuccess(liveOrder);
      }
    });

    return () => unsubscribe();
  }, [isOpen, order, onPaymentSuccess]);

  // Automated bank gateway verification polling (replaces manual button)
  useEffect(() => {
    if (!isOpen || !order) return;
    let isCancelled = false;

    const pollGatewayVerification = async () => {
      try {
        const txnid = payuData?.txnid || '';
        const res = await fetch(
          `/api/payu/verify-payment?order_id=${encodeURIComponent(order.order_id)}&txnid=${encodeURIComponent(txnid)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.paid && !isCancelled) {
            const confirmedTxnId = data.txnid || `NPCI_${Date.now()}`;
            const updated = orderStore.markOrderAsPaidViaWebhook(order.order_id, confirmedTxnId);

            confetti({
              particleCount: 90,
              spread: 75,
              origin: { y: 0.6 },
            });
            soundManager.playNewOrderChime();

            if (updated) {
              printerStore.dispatchPrintJob(updated).catch(console.warn);
              onPaymentSuccess(updated);
            } else {
              const finalOrder: Order = {
                ...order,
                payment_status: 'PAID',
                upi_txn_id: confirmedTxnId,
              };
              printerStore.dispatchPrintJob(finalOrder).catch(console.warn);
              onPaymentSuccess(finalOrder);
            }
          }
        }
      } catch {
        // Fall through silent polling
      }
    };

    const pollInterval = setInterval(pollGatewayVerification, 2500);
    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
    };
  }, [isOpen, order, payuData?.txnid, onPaymentSuccess]);

  if (!isOpen || !order) return null;

  const activePayeeVpa = currentTheater.kyc.payee_vpa || 'snackbox.pos@icici';
  const activePayeeName = currentTheater.kyc.legal_business_name || currentTheater.name;
  
  // Standard NPCI UPI URI Specification
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(activePayeeVpa)}&pn=${encodeURIComponent(activePayeeName)}&am=${order.total_amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Token #${order.token_number} - ${order.screen_number} ${order.seat_location}`)}&tr=TXN${order.order_id.replace('#', '')}&mc=5812`;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Launch Native Phone UPI App (Google Pay, PhonePe, Paytm, CRED or Universal UPI Intent)
  const handleLaunchNativeUPI = (appId?: string) => {
    let targetUri = upiIntentUri;
    
    if (appId === 'gpay') {
      targetUri = upiIntentUri.replace('upi://', 'tez://upi/');
    } else if (appId === 'phonepe') {
      targetUri = upiIntentUri.replace('upi://', 'phonepe://');
    } else if (appId === 'paytm') {
      targetUri = upiIntentUri.replace('upi://', 'paytmmp://');
    } else if (appId === 'cred') {
      targetUri = upiIntentUri.replace('upi://', 'cred://');
    }

    window.location.href = targetUri;

    // Universal fallback to standard upi:// scheme
    if (appId) {
      setTimeout(() => {
        window.location.href = upiIntentUri;
      }, 1000);
    }
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(activePayeeVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-4 sm:p-6 text-neutral-100 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header with Official NPCI UPI Badge */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center p-2 shadow-inner">
              <UpiLogo className="w-full h-auto" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">UPI Payment</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Secure Pay</span>
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {currentTheater.name} • {order.screen_number} ({order.seat_location})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Hero Banner */}
        <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 text-center">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Total Payable
          </span>
          <div className="text-3xl font-black text-white mt-0.5 flex items-center justify-center gap-1">
            <span className="text-amber-400">₹</span>
            <span>{order.total_amount.toFixed(2)}</span>
          </div>

          <div className="mt-2.5 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800 text-[11px]">
              <span className="text-neutral-400">Payee:</span>
              <strong className="text-amber-300 font-mono">{activePayeeVpa}</strong>
              <button
                onClick={handleCopyVpa}
                className="ml-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Copy UPI ID"
              >
                {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[10px] text-amber-400 underline">Copy</span>}
              </button>
            </div>
            <div className="flex items-center gap-1 text-neutral-400 font-mono text-[11px] bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* 1-Tap Pay via Real UPI Apps with Authentic Brand Logos */}
        <div className="mt-4">
          <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block mb-2 flex items-center justify-between">
            <span>Pay via Installed App</span>
            <span className="text-emerald-400 text-[10px] normal-case font-medium flex items-center gap-1">
              <Zap className="w-3 h-3" /> 1-Tap Handshake
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {UPI_APPS.map((app) => (
              <button
                key={app.id}
                onClick={() => handleLaunchNativeUPI(app.id)}
                className="p-2.5 sm:p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 active:scale-[0.98] text-left transition-all flex items-center justify-between group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-center p-1 group-hover:border-neutral-700 transition-colors">
                    {app.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white block group-hover:text-amber-400">
                        {app.name}
                      </span>
                      {app.badge && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/20">
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 block truncate max-w-[85px] sm:max-w-[105px]">
                      {app.subtitle}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>

          {/* Universal Launch Button */}
          <button
            onClick={() => handleLaunchNativeUPI()}
            disabled={isLoadingPayment}
            className="w-full mt-2.5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Smartphone className="w-4 h-4 text-neutral-950" />
            <span>Open Default UPI App • ₹{order.total_amount.toFixed(2)}</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-950" />
          </button>
        </div>

        {/* NPCI QR Scanner Box */}
        <div className="mt-4 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-300 font-semibold mb-2.5">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>Or Scan with Any Phone Camera / UPI Scanner</span>
          </div>

          <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mx-auto border-2 border-neutral-700/60">
            <QRCodeSVG
              value={upiIntentUri}
              size={135}
              level="M"
              includeMargin={false}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-neutral-300 text-[11px]">Auto-detecting incoming bank payment</span>
          </div>
        </div>

        {/* Real-Time Automated Gateway Verification Status */}
        <div className="mt-3.5 p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>Awaiting Payment Confirmation from Bank</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Complete the payment in your UPI app or scan the QR above. The gateway verifies directly with your bank and dispatches your order instantly.
          </p>
        </div>

        {/* Cancel Action */}
        <div className="mt-2.5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Cancel & Return to Menu</span>
          </button>
        </div>

        {/* Trust Footer */}
        <div className="mt-3 text-center text-[10px] text-neutral-500 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>NPCI Unified Payments Interface</span>
          </div>
          <span>•</span>
          <span>Bank-Grade Encryption</span>
        </div>
      </div>
    </div>
  );
};
