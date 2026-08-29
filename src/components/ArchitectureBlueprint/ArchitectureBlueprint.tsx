import React, { useState } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Database, 
  Server, 
  Zap, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  Send, 
  Printer, 
  FileCode, 
  Lock, 
  ArrowRight,
  TrendingDown,
  Archive,
  Sparkles,
  Terminal
} from 'lucide-react';
import { orderStore } from '../../utils/storage';
import { soundManager } from '../../utils/audio';

export const ArchitectureBlueprint: React.FC = () => {
  const [webhookOrderId, setWebhookOrderId] = useState<string>('#10927');
  const [webhookStatus, setWebhookStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS'>('IDLE');
  const [webhookLog, setWebhookLog] = useState<string>('');

  const handleSimulateWebhook = () => {
    setWebhookStatus('SENDING');
    setWebhookLog(`[${new Date().toISOString()}] Sending signed POST /api/v1/upi/webhook...`);

    setTimeout(() => {
      const generatedTxnId = `NPCI_SETTLE_${Date.now()}`;
      // Inject order if not present or mark paid
      orderStore.createOrder({
        screen_number: 'Audi 3',
        seat_location: 'F-12',
        delivery_mode: 'SEAT_SERVICE',
        payment_status: 'PAID',
        progress_status: 'RECEIVED',
        items: [
          { name: 'Tub Popcorn (Cheese Supreme)', quantity: 1, price: 240 },
          { name: 'Fountain Soda (Chilled Pepsi)', quantity: 1, price: 120 },
        ],
        total_amount: 360,
        customer_name: 'Webhook Auto-Customer',
        customer_phone: '9800000000',
      });

      setWebhookStatus('SUCCESS');
      setWebhookLog((prev) => 
        prev + `\n[${new Date().toISOString()}] Signature Verified (HMAC-SHA256). Bank Settlement 100% (MDR 0%).\n[${new Date().toISOString()}] DB Trigger Fired: Order ${webhookOrderId} status updated to "PAID".\n[${new Date().toISOString()}] Thermal Printer & Kitchen Tablet Dispatched!`
      );
    }, 600);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 py-4 sm:py-6 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-amber-500/15 via-neutral-900 to-neutral-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
              System Specification & Engineering Blueprint
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            0% MDR UPI Cinema In-Seat System & Low-Cost Architecture
          </h1>
          <p className="text-sm text-neutral-400 mt-2 max-w-3xl leading-relaxed">
            A battle-tested blueprint that eliminates 1.99% credit card and wallet interchange fees while maintaining sub-second kitchen routing, automated thermal printing, and zero idle compute costs.
          </p>
        </div>

        {/* Part 1: The Zero-MDR UPI Technical Pipeline */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              01
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">0% MDR UPI Payment Pipeline (Behind the Scenes)</h2>
              <p className="text-xs text-neutral-400">How transaction fees are kept at absolute 0% with NPCI direct settlement</p>
            </div>
          </div>

          {/* Flow Diagram */}
          <div className="bg-neutral-950 p-4 sm:p-6 rounded-2xl border border-neutral-800 font-mono text-xs overflow-x-auto text-neutral-300">
            <div className="text-amber-400 font-bold mb-2">/* ARCHITECTURE FLOW DIAGRAM */</div>
            <pre className="leading-relaxed">
{`[ User Phone (Seat F-12) ] --------(1) Request Intent Link--------> [ Node.js Backend Server ]
      |                                                                 ^
(2) Opens UPI App (GPay/PhonePe)                                         |
      |                                                          (4) Secure Webhook (HMAC)
      v                                                                 |
[ NPCI / Banking Network ] -----(3) Instant 0% Settlement------> [ Payment Gateway Provider ]
                                                                        |
                                                            (5) Event-Driven Push
                                                                        v
                                                             [ Kitchen Tablet & Thermal Printer ]`}
            </pre>
          </div>

          {/* 5 Core Steps Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">1</span>
                <span>Smart QR Code Routing</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Armrest stickers encode parameters: <code className="text-amber-300 bg-neutral-900 px-1 py-0.5 rounded font-mono">?audi=3&row=F&seat=12</code>. When scanned, the frontend locks these variables into the customer's session with 100% physical accuracy.
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">2</span>
                <span>Strict UPI-Only Intent Generation</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                The backend issues gateway payload with <code className="text-emerald-400 font-mono">credit_card: false</code> and <code className="text-emerald-400 font-mono">prepaid_wallet: false</code>. This guarantees only direct bank accounts are permitted.
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">3</span>
                <span>Zero-MDR Direct Bank Settlement</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Because credit cards and PPI wallets are barred, money travels across the NPCI banking rails at exactly <strong>0% MDR</strong>. 100% of the ₹350 reaches the cinema's corporate bank account.
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">4</span>
                <span>Secure Webhook Verification</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Upon bank clearance, the payment gateway sends a signed POST Webhook. The backend validates the cryptographic signature and updates <code className="text-amber-300 font-mono">payment_status = "PAID"</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Part 2: Straightforward Database Architecture */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
              02
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Database Schema Design (Orders Table)</h2>
              <p className="text-xs text-neutral-400">Standard, clean SQL/NoSQL schema with zero fluff</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-semibold border-b border-neutral-800">
                <tr>
                  <th className="p-3.5">Field Name</th>
                  <th className="p-3.5">Data Type</th>
                  <th className="p-3.5">Example</th>
                  <th className="p-3.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80 bg-neutral-900/60 font-mono">
                <tr>
                  <td className="p-3.5 font-bold text-amber-400">order_id</td>
                  <td className="p-3.5 text-neutral-300">String / PK</td>
                  <td className="p-3.5 text-neutral-400">"#10924"</td>
                  <td className="p-3.5 font-sans text-neutral-300">Unique alphanumeric order transaction identifier</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-amber-400">token_number</td>
                  <td className="p-3.5 text-neutral-300">Integer (1–200)</td>
                  <td className="p-3.5 text-neutral-400">84</td>
                  <td className="p-3.5 font-sans text-neutral-300">Daily rotating kitchen token for easy vocal pickup calling</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-amber-400">screen_number</td>
                  <td className="p-3.5 text-neutral-300">String / Int</td>
                  <td className="p-3.5 text-neutral-400">"Screen 02" / "Audi 3"</td>
                  <td className="p-3.5 font-sans text-neutral-300">Cinema auditorium where the movie is playing</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-amber-400">seat_location</td>
                  <td className="p-3.5 text-neutral-300">String</td>
                  <td className="p-3.5 text-neutral-400">"M-14" / "F-12"</td>
                  <td className="p-3.5 font-sans text-neutral-300">Exact row and seat number on the armrest sticker</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-amber-400">delivery_mode</td>
                  <td className="p-3.5 text-neutral-300">Enum</td>
                  <td className="p-3.5 text-emerald-400">"SEAT_SERVICE" | "COUNTER_PICKUP"</td>
                  <td className="p-3.5 font-sans text-neutral-300">Specifies runner in-seat delivery vs customer counter pickup</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-amber-400">payment_status</td>
                  <td className="p-3.5 text-neutral-300">String / Enum</td>
                  <td className="p-3.5 text-emerald-400">"PENDING" ➔ "PAID"</td>
                  <td className="p-3.5 font-sans text-neutral-300">Updated automatically via webhook upon bank clearance</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-amber-400">order_timestamp</td>
                  <td className="p-3.5 text-neutral-300">Timestamp (ISO)</td>
                  <td className="p-3.5 text-neutral-400">"2026-08-23T19:15:00Z"</td>
                  <td className="p-3.5 font-sans text-neutral-300">Exact audit timestamp for preparation pacing & analytics</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Part 3: Low-Compute Cost Serverless & Archiving Blueprint */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
              03
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Compute-Cost Reduction & Serverless Architecture</h2>
              <p className="text-xs text-neutral-400">How to handle millions of orders with near ₹0 server idle costs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <Zap className="w-4 h-4" />
                <span>1. Event-Driven DB Triggers</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Rather than running continuous polling servers, database row updates (<code className="text-neutral-300 font-mono">status = PAID</code>) fire lightweight serverless event triggers that push directly to the kitchen via WebSockets or Server-Sent Events (SSE).
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <TrendingDown className="w-4 h-4" />
                <span>2. Zero Idle Compute Cost</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                The QR menu is served statically via Global CDN (Cloudflare / Cloud Run scale-to-zero). When no customer is scanning or ordering, compute consumption is <strong>0 CPU seconds</strong>.
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <Archive className="w-4 h-4" />
                <span>3. Scheduled Daily Archiving</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                A simple nightly cron at 03:00 AM moves delivered orders older than 24 hours to cold archive storage (GCS/S3), keeping the active <code className="text-neutral-300 font-mono">Orders</code> collection featherweight and query speeds under 5ms.
              </p>
            </div>
          </div>
        </div>

        {/* Part 4: Interactive Webhook Simulator */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                04
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Interactive Payment Webhook Tester</h2>
                <p className="text-xs text-neutral-400">Test how payment gateway signatures trigger instant kitchen routing</p>
              </div>
            </div>

            <button
              onClick={handleSimulateWebhook}
              disabled={webhookStatus === 'SENDING'}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Fire Simulated Webhook</span>
            </button>
          </div>

          {/* Terminal output box */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 font-mono text-xs space-y-2 text-neutral-300">
            <div className="flex items-center justify-between text-neutral-500 text-[11px] pb-2 border-b border-neutral-800">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Webhook Console Log</span>
              </span>
              <span className="text-emerald-400 font-bold">HMAC-SHA256 ACTIVE</span>
            </div>

            <pre className="text-neutral-400 whitespace-pre-wrap leading-relaxed">
              {webhookLog || `Ready. Click "Fire Simulated Webhook" to execute an encrypted POST notification payload from NPCI gateway.`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
