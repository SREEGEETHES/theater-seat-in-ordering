import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  IndianRupee, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  ArrowUpRight, 
  RefreshCw, 
  Filter, 
  ShieldCheck, 
  Download, 
  Search, 
  Clock, 
  Calendar, 
  Activity, 
  AlertTriangle,
  Zap,
  Smartphone,
  Check,
  ChevronRight
} from 'lucide-react';
import { Theater, PayUTransactionRecord, UPIAnalyticsMetrics } from '../../types';
import { theaterStore } from '../../utils/theaterStore';
import { analyticsStore } from '../../utils/analyticsStore';

interface RevenueAnalyticsProps {
  theater?: Theater;
}

export const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ theater }) => {
  const currentTheater = theater || theaterStore.getActiveTheater();
  const [metrics, setMetrics] = useState<UPIAnalyticsMetrics>(
    analyticsStore.calculateMetrics(currentTheater.theater_id)
  );
  const [transactions, setTransactions] = useState<PayUTransactionRecord[]>(
    analyticsStore.getTransactions(currentTheater.theater_id)
  );
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string>('');

  useEffect(() => {
    const unsub = analyticsStore.subscribe(() => {
      setMetrics(analyticsStore.calculateMetrics(currentTheater.theater_id));
      setTransactions(analyticsStore.getTransactions(currentTheater.theater_id));
    });
    return () => unsub();
  }, [currentTheater.theater_id]);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const result = analyticsStore.syncFromPayUPipeline(currentTheater.theater_id);
      setIsSyncing(false);
      setSyncFeedback(`PayU Ingestion Sync Completed • Hash: ${result.hash_signature.slice(0, 14)}...`);
      setTimeout(() => setSyncFeedback(''), 4000);
    }, 800);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterStatus === 'SUCCESS' && t.payment_status !== 'success') return false;
    if (filterStatus === 'FAILED' && t.payment_status !== 'failed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.txnid.toLowerCase().includes(q) ||
        t.order_id.toLowerCase().includes(q) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
        (t.bank_ref_num && t.bank_ref_num.toLowerCase().includes(q)) ||
        (t.upi_app && t.upi_app.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getUpiBadgeColor = (app?: string) => {
    switch (app) {
      case 'Google Pay':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'PhonePe':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Paytm':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'CRED':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'BHIM UPI':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & PayU Integration Pipeline Card */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/25 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">
                Revenue & PayU UPI Analytics
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                Live Rails
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Incoming F&B snack volume, UPI conversion telemetry, and bank settlement verification for{' '}
              <strong className="text-neutral-200">{currentTheater.name}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync PayU Pipeline</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn font-mono">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* 4 Core Financial KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Volume */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Total UPI Gross Volume</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{metrics.total_gross_volume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Direct to {currentTheater.kyc.bank_name.split(',')[0]}</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>UPI Conversion Rate</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {metrics.conversion_rate}%
          </div>
          <div className="text-[11px] text-neutral-400">
            {metrics.successful_transactions} of {metrics.total_initiated} attempts completed
          </div>
        </div>

        {/* Average Transaction Value */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Average Order Value (ATV)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{metrics.average_transaction_value.toFixed(2)}
          </div>
          <div className="text-[11px] text-neutral-400">
            Across {metrics.successful_transactions} settled in-seat orders
          </div>
        </div>

        {/* Successful vs Failed Count */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Payment Success / Drop-off</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{metrics.successful_transactions}</span>
            <span className="text-xs text-neutral-500">paid /</span>
            <span className="text-xl font-bold text-rose-400">{metrics.failed_transactions}</span>
            <span className="text-xs text-neutral-500">failed</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            {(metrics.failed_transactions / (metrics.total_initiated || 1) * 100).toFixed(1)}% drop-off rate
          </div>
        </div>
      </div>

      {/* 2 Column Analytical Visualizers: Hourly Trends & Drop-off / Failure Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Distribution Bar Chart (SVG) */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Show-Time Hourly Revenue</h3>
            </div>
            <span className="text-[11px] text-neutral-400">Peak interval analysis</span>
          </div>

          <div className="space-y-3 pt-2">
            {metrics.hourly_distribution.map((slot, idx) => {
              const maxRev = Math.max(...metrics.hourly_distribution.map((h) => h.revenue), 1000);
              const pct = (slot.revenue / maxRev) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-300 font-medium">{slot.hour_label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-400 text-[11px]">{slot.success_count} orders</span>
                      <span className="font-mono font-bold text-white">₹{slot.revenue.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* UPI Drop-off & Failure Reason Breakdown (from unmappedstatus) */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-sm text-white">UPI Failure Breakdown</h3>
            </div>
            <span className="text-[10px] text-neutral-400 uppercase font-mono">unmappedstatus</span>
          </div>

          {metrics.failure_breakdown.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 text-xs">
              No failed transactions recorded.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {metrics.failure_breakdown.map((f, idx) => (
                <div key={idx} className="p-3 bg-neutral-950/70 border border-neutral-800/90 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200">{f.reason}</span>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {f.count} ({f.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${f.percentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    PayU Code: <code className="text-neutral-400">{f.code}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PayU UPI Real-Time Ingestion Transaction Ledger Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="font-bold text-sm text-white">PayU UPI Ingestion Ledger</h3>
            <p className="text-[11px] text-neutral-400">
              Direct telemetry from PayU gateway with NPCI UTR reference numbers
            </p>
          </div>

          {/* Filter and Search */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-1">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                onClick={() => setFilterStatus('SUCCESS')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterStatus === 'SUCCESS'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Success ({metrics.successful_transactions})
              </button>
              <button
                onClick={() => setFilterStatus('FAILED')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterStatus === 'FAILED'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Failed ({metrics.failed_transactions})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search UTR, Txn ID, Guest..."
                className="bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-amber-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-[11px] uppercase text-neutral-400 font-semibold">
                <th className="pb-3 font-semibold">Txn ID &amp; Order</th>
                <th className="pb-3 font-semibold">Guest &amp; Seat</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">UPI App &amp; NPCI Ref (UTR)</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Settlement</th>
                <th className="pb-3 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    No transactions match your query.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.txnid} className="hover:bg-neutral-950/40 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="font-mono font-bold text-white">{txn.txnid}</div>
                      <div className="text-[11px] text-amber-400/90 font-mono">{txn.order_id}</div>
                    </td>
                    <td className="py-3 pr-2">
                      <div className="text-neutral-200 font-medium">{txn.customer_name || 'Moviegoer'}</div>
                      <div className="text-[11px] text-neutral-400">
                        {txn.screen_number} • Seat {txn.seat_location}
                      </div>
                    </td>
                    <td className="py-3 pr-2 font-black text-white font-mono">
                      ₹{txn.amount.toFixed(2)}
                    </td>
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${getUpiBadgeColor(txn.upi_app)}`}>
                          {txn.upi_app || 'UPI'}
                        </span>
                      </div>
                      {txn.bank_ref_num ? (
                        <div className="text-[10px] text-neutral-400 font-mono">
                          UTR: {txn.bank_ref_num}
                        </div>
                      ) : (
                        <div className="text-[10px] text-rose-400/80">
                          {txn.unmappedstatus || 'Aborted by user'}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      {txn.payment_status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PAID</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3 h-3" />
                          <span>FAILED</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                        {txn.settlement_status || 'settled'}
                      </span>
                    </td>
                    <td className="py-3 text-right text-[11px] text-neutral-400 whitespace-nowrap">
                      {new Date(txn.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
