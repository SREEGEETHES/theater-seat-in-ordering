import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Receipt, 
  Sparkles, 
  ChefHat, 
  Truck, 
  Film, 
  ShieldCheck, 
  ChevronRight,
  Printer,
  X
} from 'lucide-react';
import { Order, OrderProgressStatus } from '../../types';
import { VirtualOrderReceiptPrinter } from '../ReceiptPrinter/VirtualOrderReceiptPrinter';

interface ActiveOrderTrackerProps {
  order: Order;
  onNewOrder: () => void;
}

export const ActiveOrderTracker: React.FC<ActiveOrderTrackerProps> = ({
  order,
  onNewOrder,
}) => {
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(true);

  const steps: { key: OrderProgressStatus; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      key: 'RECEIVED',
      label: 'Order & UPI Paid',
      desc: '0% MDR Bank Settlement Verified',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    },
    {
      key: 'PREPARING',
      label: 'Kitchen Preparing',
      desc: 'Fresh popcorn & drinks being packed',
      icon: <ChefHat className="w-5 h-5 text-amber-400" />,
    },
    {
      key: 'READY_OR_DISPATCHED',
      label: order.delivery_mode === 'SEAT_SERVICE' ? 'Runner En Route to Seat' : 'Ready at Pickup Counter',
      desc: order.delivery_mode === 'SEAT_SERVICE' 
        ? `Delivering directly to ${order.screen_number} ${order.seat_location}` 
        : 'Please show your token at the snack counter',
      icon: <Truck className="w-5 h-5 text-sky-400" />,
    },
    {
      key: 'DELIVERED',
      label: 'Delivered',
      desc: 'Enjoy your movie & snacks!',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    },
  ];

  const getStepIndex = (status: OrderProgressStatus) => {
    switch (status) {
      case 'RECEIVED': return 0;
      case 'PREPARING': return 1;
      case 'READY_OR_DISPATCHED': return 2;
      case 'DELIVERED': return 3;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.progress_status);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Token Hero Banner */}
      <div className="bg-gradient-to-br from-amber-500/20 via-neutral-900 to-neutral-900 border border-amber-500/30 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Film className="w-32 h-32 text-amber-400" />
        </div>

        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
          Daily Counter Token
        </span>
        <div className="text-5xl sm:text-6xl font-black text-white tracking-tight my-1 flex items-center justify-center gap-1">
          <span className="text-amber-400">#</span>
          <span>{order.token_number}</span>
        </div>

        {/* Location & Delivery Mode */}
        <div className="mt-3 inline-flex items-center gap-2 bg-neutral-950/80 border border-neutral-800 px-3.5 py-1.5 rounded-full text-xs text-neutral-200">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold text-white">
            {order.delivery_mode === 'SEAT_SERVICE' ? (
              <>{order.screen_number} • Seat {order.seat_location} (In-Seat Delivery)</>
            ) : (
              <>Snack Counter Self Pickup</>
            )}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-neutral-400">
          <span>Order ID: <strong className="text-neutral-200">{order.order_id}</strong></span>
          <span>•</span>
          <span>Time: <strong className="text-neutral-200">{order.time_display}</strong></span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PAID via UPI
          </span>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-lg">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
          Live Order Status
        </h4>

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={step.key} className="flex items-start gap-3 relative">
                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-4 top-8 w-0.5 h-8 -ml-[1px] transition-colors ${
                      idx < currentStepIdx ? 'bg-amber-500' : 'bg-neutral-800'
                    }`}
                  />
                )}

                {/* Circle Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all z-10 ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-md shadow-amber-500/20 scale-110'
                      : isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Text description */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        isCurrent
                          ? 'text-amber-400'
                          : isCompleted
                          ? 'text-neutral-200'
                          : 'text-neutral-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="animate-pulse flex h-2 w-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ordered Items Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Items in Order ({order.items.length})
          </h4>
          <span className="text-xs font-bold text-neutral-300">Total: ₹{order.total_amount}</span>
        </div>

        <div className="divide-y divide-neutral-800/80">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">{item.quantity}x</span>
                <div>
                  <span className="text-neutral-200 font-medium">{item.name}</span>
                  {item.size && <span className="text-neutral-500 ml-1">({item.size})</span>}
                  {item.flavor && <span className="text-neutral-500 block text-[11px]">{item.flavor}</span>}
                </div>
              </div>
              <span className="font-semibold text-neutral-300">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons: View Virtual Receipt & Order More */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowReceiptModal(true)}
          className="flex-1 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Open Thermal Receipt Printer</span>
        </button>

        <button
          onClick={onNewOrder}
          className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
        >
          <span>Order More Snacks</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Virtual Thermal Receipt Printer Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-4 sm:p-5 text-neutral-100 shadow-2xl relative max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm text-white">Live Virtual Receipt Printer</h4>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Virtual Printer Component */}
            <VirtualOrderReceiptPrinter order={order} autoStart={true} />

            <div className="mt-4 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
              >
                Back to Order Tracker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

