import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  MapPin, 
  Store, 
  ShieldCheck, 
  ArrowRight, 
  Check,
  User,
  Phone,
  Sparkles
} from 'lucide-react';
import { CartItem, DeliveryMode, SeatLocation, Order } from '../../types';
import { orderStore } from '../../utils/storage';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  currentSeat: SeatLocation;
  onOpenSeatSelector: () => void;
  onInitiatePayment: (order: Order) => void;
}

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentSeat,
  onOpenSeatSelector,
  onInitiatePayment,
}) => {
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('SEAT_SERVICE');
  const [customerName, setCustomerName] = useState<string>('Rahul Kumar');
  const [customerPhone, setCustomerPhone] = useState<string>('9876543210');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalAmount = subtotal;

  const handleProceedToPay = () => {
    if (cartItems.length === 0) return;

    const orderItems = cartItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      size: item.selectedSize,
      flavor: item.selectedFlavor,
    }));

    const newOrder = orderStore.createOrder({
      screen_number: currentSeat.screen,
      seat_location: deliveryMode === 'SEAT_SERVICE' ? `${currentSeat.row}-${currentSeat.seat}` : 'Snack Counter',
      delivery_mode: deliveryMode,
      payment_status: 'PENDING',
      progress_status: 'RECEIVED',
      items: orderItems,
      total_amount: totalAmount,
      customer_name: customerName || 'Valued Cinema Guest',
      customer_phone: customerPhone || '',
      notes: notes || undefined,
    });

    onInitiatePayment(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border-l border-neutral-800 w-full max-w-md h-full flex flex-col text-neutral-100 shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-white">Your Cinema Cart</h3>
            <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full">
              {cartItems.length} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 space-y-3">
              <div className="w-16 h-16 rounded-full bg-neutral-950 flex items-center justify-center mx-auto text-neutral-600">
                🛒
              </div>
              <p className="text-sm">Your tray is currently empty.</p>
              <button
                onClick={onClose}
                className="text-xs text-amber-400 font-semibold underline hover:text-amber-300"
              >
                Browse Delicious Snacks
              </button>
            </div>
          ) : (
            <>
              {/* Delivery Choice Option A vs Option B Toggle */}
              <div>
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                  Select Delivery Choice
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Option A: Deliver to Seat */}
                  <button
                    onClick={() => setDeliveryMode('SEAT_SERVICE')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      deliveryMode === 'SEAT_SERVICE'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      {deliveryMode === 'SEAT_SERVICE' && (
                        <Check className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="font-bold text-xs text-white">Deliver to Seat</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {currentSeat.screen}, Row {currentSeat.row}-{currentSeat.seat}
                    </div>
                  </button>

                  {/* Option B: Counter Pickup */}
                  <button
                    onClick={() => setDeliveryMode('COUNTER_PICKUP')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      deliveryMode === 'COUNTER_PICKUP'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Store className="w-4 h-4 text-amber-400" />
                      {deliveryMode === 'COUNTER_PICKUP' && (
                        <Check className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="font-bold text-xs text-white">Counter Pickup</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Collect at F&B desk with token
                    </div>
                  </button>
                </div>

                {deliveryMode === 'SEAT_SERVICE' && (
                  <div className="mt-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Armrest Sticker Location:</span>
                    <button
                      onClick={onOpenSeatSelector}
                      className="text-amber-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>{currentSeat.screen} • {currentSeat.row}-{currentSeat.seat}</span>
                      <span className="text-[10px] text-neutral-500">(Change)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Customer Info Form */}
              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800/80 space-y-3">
                <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Guest Information
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Your Name</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Rahul K"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Phone (SMS Alert)</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cart Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Selected Items
                  </label>
                  <button
                    onClick={onClearCart}
                    className="text-[11px] text-neutral-500 hover:text-rose-400 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-semibold text-xs text-white">{item.name}</div>
                          <div className="text-[11px] text-neutral-400">
                            {item.selectedSize && <span>{item.selectedSize} </span>}
                            {item.selectedFlavor && <span className="text-amber-400">• {item.selectedFlavor}</span>}
                          </div>
                          <div className="text-xs font-bold text-amber-400 mt-0.5">
                            ₹{item.price * item.quantity}
                          </div>
                        </div>
                      </div>

                      {/* Quantity buttons */}
                      <div className="flex items-center gap-2 bg-neutral-900 px-2 py-1 rounded-xl border border-neutral-800">
                        <button
                          onClick={() => {
                            if (item.quantity === 1) {
                              onRemoveItem(item.id);
                            } else {
                              onUpdateQuantity(item.id, -1);
                            }
                          }}
                          className="text-neutral-400 hover:text-white p-0.5"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-rose-400" /> : <Minus className="w-3.5 h-3.5" />}
                        </button>
                        <span className="font-bold text-xs text-white w-3 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="text-neutral-400 hover:text-white p-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Details */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Item Total</span>
                  <span className="text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>0% MDR UPI Fee</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">₹0.00 (FREE)</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Convenience & Delivery Surcharge</span>
                  <span className="text-emerald-400 font-semibold">₹0.00 (FREE)</span>
                </div>
                <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold text-sm text-white">
                  <span>To Pay</span>
                  <span className="text-amber-400">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer / Pay Button */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-950">
            <button
              onClick={handleProceedToPay}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Pay via 0% MDR UPI</span>
              <span>•</span>
              <span>₹{totalAmount.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <p className="text-[11px] text-center text-neutral-400 mt-2">
              Opens Google Pay, PhonePe or Paytm with instant bank settlement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
