import React, { useState, useEffect } from 'react';
import { 
  ReceiptPrinter, 
  ReceiptPrinterStage 
} from './ReceiptPrinter';
import { Order } from '../../types';
import { 
  Film, 
  Printer, 
  CheckCircle2, 
  RotateCcw, 
  MapPin, 
  ShieldCheck, 
  Smartphone,
  Sparkles,
  Download
} from 'lucide-react';
import { printThermalReceiptInBrowser, generateThermalReceiptText } from '../../utils/escpos';
import { soundManager } from '../../utils/audio';

interface VirtualOrderReceiptPrinterProps {
  order: Order;
  autoStart?: boolean;
  onFinish?: () => void;
}

export const VirtualOrderReceiptPrinter: React.FC<VirtualOrderReceiptPrinterProps> = ({
  order,
  autoStart = true,
  onFinish,
}) => {
  const [stage, setStage] = useState<ReceiptPrinterStage>('processing');
  const [feedMotion, setFeedMotion] = useState<'stepped' | 'smooth'>('stepped');

  const startPrintSequence = () => {
    setStage('processing');
    
    // Stage 1 -> Stage 2 (Printing) after 600ms
    const t1 = setTimeout(() => {
      setStage('printing');
      // Play printer motor & paper feed sound sequence
      soundManager.playPrinterFeedSound();
    }, 800);

    // Stage 2 -> Stage 3 (Complete) after 2600ms
    const t2 = setTimeout(() => {
      setStage('complete');
      soundManager.playPaperCutChime();
      onFinish?.();
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  };

  useEffect(() => {
    if (autoStart) {
      return startPrintSequence();
    }
  }, [order.order_id, autoStart]);

  const handleReprint = () => {
    startPrintSequence();
  };

  const handleDownloadSlipText = () => {
    const text = generateThermalReceiptText(order);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${order.order_id.replace('#', '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <ReceiptPrinter.Root stage={stage} feedMotion={feedMotion}>
        <ReceiptPrinter.Machine>
          {/* Printer Header */}
          <ReceiptPrinter.Header>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Film className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-neutral-200 tracking-tight">
                CINESNACK POS-80
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReprint}
                className="text-[11px] px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center gap-1"
                title="Feed & Reprint"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Feed</span>
              </button>
            </div>
          </ReceiptPrinter.Header>

          {/* LCD Screen Display */}
          <ReceiptPrinter.Screen>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">
                  TOKEN #{order.token_number}
                </span>
                <span className="text-neutral-400">
                  {order.screen_number} • {order.seat_location}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] text-neutral-400">
                  <span>Total Amount</span>
                  <div className="text-sm font-extrabold text-emerald-400">
                    ₹{order.total_amount.toFixed(2)} (PAID)
                  </div>
                </div>
                <div className="text-right text-[10px] text-neutral-500 font-mono">
                  0% MDR UPI
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/80">
                <ReceiptPrinter.Status />
              </div>
            </div>
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>

        {/* Paper Output Slot with Jagged Tear Edge */}
        <ReceiptPrinter.Output>
          <ReceiptPrinter.Paper className="text-xs font-mono select-none">
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-neutral-400 space-y-0.5">
              <div className="font-extrabold text-sm tracking-tight text-neutral-900">
                GRAND CINEPLEX F&B
              </div>
              <div className="text-[10px] text-neutral-600">
                IN-SEAT DIGITAL DINING RECEIPT
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                CINEMA AUDI SNACK ENGINE
              </div>
            </div>

            {/* Token & Seat Location */}
            <div className="py-2.5 my-2 border-y-2 border-neutral-900 text-center bg-neutral-200/60 rounded">
              <div className="text-[10px] font-bold text-neutral-600 uppercase">
                {order.delivery_mode === 'SEAT_SERVICE' ? '★ IN-SEAT DELIVERY ★' : '★ COUNTER PICKUP ★'}
              </div>
              <div className="text-2xl font-black text-neutral-950 tracking-tight">
                TOKEN #{order.token_number}
              </div>
              <div className="text-xs font-bold text-neutral-800">
                {order.screen_number} • SEAT {order.seat_location}
              </div>
            </div>

            {/* Order Details */}
            <div className="text-[11px] space-y-0.5 text-neutral-600 pb-2 border-b border-dashed border-neutral-400">
              <div className="flex justify-between">
                <span>Order No:</span>
                <span className="font-bold text-neutral-900">{order.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="text-neutral-900">{order.time_display}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold text-neutral-900">0% MDR UPI</span>
              </div>
              {order.upi_txn_id && (
                <div className="flex justify-between text-[10px]">
                  <span>NPCI Ref:</span>
                  <span className="font-mono text-neutral-700">{order.upi_txn_id.slice(-10)}</span>
                </div>
              )}
            </div>

            {/* Item Breakdown */}
            <div className="py-2 space-y-1.5 border-b border-dashed border-neutral-400">
              <div className="flex justify-between font-bold text-[11px] text-neutral-800">
                <span>ITEM</span>
                <span>QTY x AMT</span>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px] text-neutral-800">
                  <div className="pr-2 leading-tight">
                    <span>{item.name}</span>
                    {item.size && <span className="text-[10px] text-neutral-500 block">({item.size})</span>}
                  </div>
                  <div className="font-mono whitespace-nowrap text-right">
                    {item.quantity} x ₹{item.price}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2 space-y-1 border-b-2 border-neutral-900">
              <div className="flex justify-between text-xs font-bold text-neutral-900">
                <span>TOTAL PAID (INR):</span>
                <span>₹{order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-emerald-800 font-semibold">
                <span>UPI MDR FEE:</span>
                <span>₹0.00 (100% Direct)</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-neutral-600 space-y-1">
              <div className="font-bold text-neutral-800">
                {order.delivery_mode === 'SEAT_SERVICE'
                  ? 'Runner is bringing your order to your seat!'
                  : 'Please show this token at the snack counter'}
              </div>
              <div className="text-[9px] text-neutral-500">
                *** THANK YOU & ENJOY THE MOVIE ***
              </div>
            </div>
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>

      {/* Action buttons below printer */}
      <div className="mt-4 flex items-center justify-center gap-2 max-w-sm w-full px-4">
        <button
          onClick={() => printThermalReceiptInBrowser(order)}
          className="flex-1 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>Browser Print</span>
        </button>

        <button
          onClick={handleDownloadSlipText}
          className="flex-1 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span>Save .TXT Slip</span>
        </button>
      </div>
    </div>
  );
};
