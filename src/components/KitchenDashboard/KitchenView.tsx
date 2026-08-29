import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Clock, 
  MapPin, 
  Printer, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Truck, 
  Store, 
  Layers, 
  Search, 
  Plus, 
  RefreshCw,
  Megaphone,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Order, OrderProgressStatus, DeliveryMode } from '../../types';
import { orderStore } from '../../utils/storage';
import { soundManager } from '../../utils/audio';
import { printThermalReceiptInBrowser, generateThermalReceiptText } from '../../utils/escpos';
import { VirtualOrderReceiptPrinter } from '../ReceiptPrinter/VirtualOrderReceiptPrinter';
import { printerStore } from '../../utils/printerStore';


interface KitchenViewProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({
  soundEnabled,
  onToggleSound,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'seat' | 'counter' | 'completed'>('all');
  const [screenFilter, setScreenFilter] = useState<string>('all');
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  useEffect(() => {
    const updateList = () => {
      setOrders(orderStore.getOrders());
    };
    updateList();
    const unsubscribe = orderStore.subscribe(updateList);
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = (orderId: string, newStatus: OrderProgressStatus) => {
    orderStore.updateOrderStatus(orderId, newStatus);
    if (newStatus === 'READY_OR_DISPATCHED') {
      soundManager.playReadyChime();
    }
  };

  const handleAnnounceToken = (order: Order) => {
    if (order.delivery_mode === 'SEAT_SERVICE') {
      soundManager.callTokenNumber(order.token_number, order.screen_number, order.seat_location);
    } else {
      soundManager.callTokenNumber(order.token_number);
    }
  };

  const handlePrintSlip = async (order: Order) => {
    // Send ESC/POS payload over TCP socket to online / LAN printer
    await printerStore.dispatchPrintJob(order);
    // Also trigger browser print dialog as physical fallback
    printThermalReceiptInBrowser(order);
  };

  const handleInjectSampleOrder = () => {
    const audis = ['Audi 3', 'Screen 02', 'Audi 1', 'Audi 4 (IMAX)'];
    const rows = ['F', 'M', 'C', 'H', 'B'];
    const randomAudi = audis[Math.floor(Math.random() * audis.length)];
    const randomRow = rows[Math.floor(Math.random() * rows.length)];
    const randomSeat = Math.floor(1 + Math.random() * 20);

    const isSeat = Math.random() > 0.3;

    orderStore.createOrder({
      screen_number: randomAudi,
      seat_location: isSeat ? `${randomRow}-${randomSeat}` : 'Counter',
      delivery_mode: isSeat ? 'SEAT_SERVICE' : 'COUNTER_PICKUP',
      payment_status: 'PAID',
      progress_status: 'RECEIVED',
      items: [
        { name: 'Cheese Popcorn (Large)', quantity: 1, price: 240 },
        { name: 'Chilled Pepsi Soda', quantity: 2, price: 120 },
      ],
      total_amount: 480,
      customer_name: 'Simulated Cinema Guest',
      customer_phone: '9876500000',
    });
  };

  // Metrics calculation
  const activeOrders = orders.filter(o => o.payment_status === 'PAID' && o.progress_status !== 'DELIVERED' && o.progress_status !== 'CANCELLED');
  const preparingCount = orders.filter(o => o.progress_status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.progress_status === 'READY_OR_DISPATCHED').length;
  const completedToday = orders.filter(o => o.progress_status === 'DELIVERED').length;
  const totalRevenue = orders
    .filter(o => o.payment_status === 'PAID')
    .reduce((sum, o) => sum + o.total_amount, 0);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filterTab === 'seat' && order.delivery_mode !== 'SEAT_SERVICE') return false;
    if (filterTab === 'counter' && order.delivery_mode !== 'COUNTER_PICKUP') return false;
    if (filterTab === 'completed' && order.progress_status !== 'DELIVERED') return false;
    if (filterTab !== 'completed' && order.progress_status === 'DELIVERED') return false;
    if (screenFilter !== 'all' && order.screen_number !== screenFilter) return false;
    return true;
  });

  const uniqueScreens = Array.from(new Set(orders.map(o => o.screen_number).filter(Boolean)));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 py-4 sm:py-6 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top Control Bar & Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-md">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider block">
              Active Queue
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {activeOrders.length}
            </div>
            <span className="text-[11px] text-neutral-500">{preparingCount} currently in prep</span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-md">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider block">
              Ready / Dispatched
            </span>
            <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-1">
              {readyCount}
            </div>
            <span className="text-[11px] text-neutral-500">Awaiting runner or pickup</span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-md">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider block">
              Total UPI Revenue
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              ₹{totalRevenue}
            </div>
            <span className="text-[11px] text-emerald-400/80 font-medium">₹0 MDR Fees Saved!</span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider block">
              Quick Kitchen Actions
            </span>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleInjectSampleOrder}
                className="flex-1 text-[11px] px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold transition-all flex items-center justify-center gap-1"
                title="Simulate a new incoming paid order from an in-seat customer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Simulate Order</span>
              </button>

              <button
                onClick={() => soundManager.playNewOrderChime()}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                title="Test WebAudio Kitchen Chime"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters & Control Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-neutral-900/90 border border-neutral-800 p-3.5 rounded-2xl">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterTab === 'all'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Active Queue ({activeOrders.length})
            </button>
            <button
              onClick={() => setFilterTab('seat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                filterTab === 'seat'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Seat Service</span>
            </button>
            <button
              onClick={() => setFilterTab('counter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                filterTab === 'counter'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Counter Pickup</span>
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterTab === 'completed'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Delivered ({completedToday})
            </button>
          </div>

          {/* Screen / Audi Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <label className="text-xs text-neutral-400 font-medium whitespace-nowrap">Auditorium:</label>
            <select
              value={screenFilter}
              onChange={(e) => setScreenFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 text-xs rounded-xl px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Screens</option>
              {uniqueScreens.map((scr) => (
                <option key={scr} value={scr}>
                  {scr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders KDS Grid */}
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-neutral-500 space-y-3 bg-neutral-900/40 rounded-3xl border border-neutral-900">
            <ChefHat className="w-16 h-16 mx-auto text-neutral-700" />
            <h4 className="text-base font-bold text-neutral-400">Kitchen Display is Clear</h4>
            <p className="text-xs max-w-sm mx-auto">
              No orders matching the current filter. New paid orders from seat QR scans will flash here with sound.
            </p>
            <button
              onClick={handleInjectSampleOrder}
              className="text-xs px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold shadow-md"
            >
              + Simulate In-Seat Order
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const isSeat = order.delivery_mode === 'SEAT_SERVICE';
              const isReceived = order.progress_status === 'RECEIVED';
              const isPreparing = order.progress_status === 'PREPARING';
              const isReady = order.progress_status === 'READY_OR_DISPATCHED';

              return (
                <div
                  key={order.order_id}
                  className={`bg-neutral-900 rounded-3xl p-4 border transition-all flex flex-col justify-between shadow-xl relative overflow-hidden ${
                    isReceived
                      ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-500/10 animate-pulse'
                      : isPreparing
                      ? 'border-amber-500/80 shadow-amber-500/10'
                      : isReady
                      ? 'border-sky-500/80'
                      : 'border-neutral-800 opacity-80'
                  }`}
                >
                  {/* Top Bar: Token & Delivery Mode Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-neutral-950 font-black text-lg flex items-center justify-center shadow-md shrink-0">
                          #{order.token_number}
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-neutral-400">
                            {order.order_id} • {order.time_display}
                          </div>
                          <div className="text-xs font-bold text-white truncate">
                            {order.customer_name}
                          </div>
                        </div>
                      </div>

                      {/* Mode Badge */}
                      <span
                        className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          isSeat
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        }`}
                      >
                        {isSeat ? <Truck className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                        <span>{isSeat ? 'Seat Service' : 'Pickup'}</span>
                      </span>
                    </div>

                    {/* Prominent High-Contrast Target Location Badge */}
                    <div className="bg-neutral-950 p-2.5 rounded-2xl border border-neutral-800/80 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-[10px] text-neutral-500 uppercase font-semibold">Delivery Target</div>
                          <div className="font-extrabold text-sm sm:text-base text-amber-400">
                            {isSeat ? (
                              <>{order.screen_number} • SEAT {order.seat_location}</>
                            ) : (
                              <>SNACK COUNTER PICKUP</>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                          UPI PAID
                        </span>
                      </div>
                    </div>

                    {/* Food Items List */}
                    <div className="space-y-1.5 py-2 border-y border-neutral-800/80 my-2">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                        Kitchen Items Checklist:
                      </span>
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between text-xs py-1"
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-black text-amber-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                              {item.quantity}x
                            </span>
                            <div>
                              <span className="font-semibold text-white">{item.name}</span>
                              {item.size && (
                                <span className="text-neutral-400 block text-[11px]">{item.size}</span>
                              )}
                              {item.flavor && (
                                <span className="text-amber-300 block text-[11px]">Flavor: {item.flavor}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-neutral-400 font-mono">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-4 pt-2 space-y-2">
                    {/* Status Progress Button */}
                    {isReceived && (
                      <button
                        onClick={() => handleUpdateStatus(order.order_id, 'PREPARING')}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Start Cooking / Packing</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleUpdateStatus(order.order_id, 'READY_OR_DISPATCHED')}
                        className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        {isSeat ? (
                          <>
                            <Truck className="w-4 h-4" />
                            <span>Dispatch Runner to {order.seat_location}</span>
                          </>
                        ) : (
                          <>
                            <Store className="w-4 h-4" />
                            <span>Mark Ready at Counter (Call Token)</span>
                          </>
                        )}
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(order.order_id, 'DELIVERED')}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Order as Delivered</span>
                      </button>
                    )}

                    {/* Secondary Row: Voice Call & Thermal Print */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAnnounceToken(order)}
                        className="flex-1 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        title="Voice announce token on kitchen audio speaker"
                      >
                        <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                        <span>Call #{order.token_number}</span>
                      </button>

                      <button
                        onClick={() => handlePrintSlip(order)}
                        className="flex-1 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        title="Print physical 80mm ESC/POS thermal slip"
                      >
                        <Printer className="w-3.5 h-3.5 text-sky-400" />
                        <span>Print Slip</span>
                      </button>

                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="p-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white"
                        title="Preview raw thermal receipt text"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Virtual Thermal Receipt Viewer */}
        {selectedReceiptOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-4 sm:p-5 text-neutral-100 shadow-2xl relative max-h-[94vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-4">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-sm text-white">
                    Kitchen POS Thermal Ticket • Token #{selectedReceiptOrder.token_number}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Virtual Receipt Printer */}
              <VirtualOrderReceiptPrinter order={selectedReceiptOrder} autoStart={true} />

              <div className="mt-4 pt-3 border-t border-neutral-800 flex gap-3">
                <button
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="w-full py-2.5 rounded-xl border border-neutral-700 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
