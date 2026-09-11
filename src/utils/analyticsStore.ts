import { PayUTransactionRecord, UPIAnalyticsMetrics } from '../types';
import { theaterStore } from './theaterStore';
import { orderStore } from './storage';

const ANALYTICS_STORAGE_KEY = 'snackbox_payu_upi_ledger_v2';
const LAST_SYNC_KEY = 'snackbox_payu_last_sync_v2';

// Empty initial transaction list for genuine real-world orders
const SEED_TRANSACTIONS: PayUTransactionRecord[] = [];

class AnalyticsStore {
  private transactions: PayUTransactionRecord[] = [];
  private lastSyncTime: string | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (stored) {
        this.transactions = JSON.parse(stored);
      } else {
        this.transactions = SEED_TRANSACTIONS;
        this.saveTransactions();
      }

      this.lastSyncTime = localStorage.getItem(LAST_SYNC_KEY) || new Date().toISOString();
    } catch {
      this.transactions = SEED_TRANSACTIONS;
      this.lastSyncTime = new Date().toISOString();
    }
  }

  private saveTransactions() {
    try {
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.transactions));
      if (this.lastSyncTime) {
        localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
      }
    } catch (e) {
      console.error('Failed to save analytics transactions', e);
    }
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public recordTransaction(txn: PayUTransactionRecord) {
    this.transactions.unshift(txn);
    this.saveTransactions();
    this.notify();
  }

  public getTransactions(theaterId?: string): PayUTransactionRecord[] {
    if (!theaterId) return [...this.transactions];
    return this.transactions.filter((t) => t.theater_id === theaterId);
  }

  public getLastSyncTime(): string {
    return this.lastSyncTime || new Date().toISOString();
  }

  public syncFromPayUPipeline(theaterId: string): {
    fetched_records: number;
    new_revenue: number;
    synced_at: string;
    hash_signature: string;
  } {
    const theater = theaterStore.getTheaterById(theaterId) || theaterStore.getActiveTheater();
    const key = theater?.payu.merchant_key || 'M4vP8qT1';
    const salt = theater?.payu.merchant_salt || 'p8kL2mW9';
    const command = 'get_transaction_info';
    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    // Simulated SHA-512 Hash representation: key|command|var1|salt
    const rawHashString = `${key}|${command}|${startDate}|${salt}`;
    let hashCalc = '';
    for (let i = 0; i < 64; i++) {
      hashCalc += ((rawHashString.charCodeAt(i % rawHashString.length) * 31 + i) % 16).toString(16);
    }

    this.lastSyncTime = new Date().toISOString();
    this.saveTransactions();
    this.notify();

    return {
      fetched_records: this.transactions.length,
      new_revenue: this.calculateMetrics(theaterId).total_gross_volume,
      synced_at: this.lastSyncTime,
      hash_signature: hashCalc,
    };
  }

  public calculateMetrics(theaterId?: string): UPIAnalyticsMetrics {
    const list = this.getTransactions(theaterId);
    let totalGross = 0;
    let successCount = 0;
    let failedCount = 0;
    const failuresMap: Record<string, { count: number; code: string }> = {};

    // Grouping by hours
    const hourlyMap: Record<string, { revenue: number; success: number; failed: number }> = {
      '10 AM - 12 PM': { revenue: 0, success: 0, failed: 0 },
      '12 PM - 02 PM': { revenue: 0, success: 0, failed: 0 },
      '02 PM - 04 PM': { revenue: 0, success: 0, failed: 0 },
      '04 PM - 06 PM': { revenue: 0, success: 0, failed: 0 },
      '06 PM - 08 PM': { revenue: 0, success: 0, failed: 0 },
      '08 PM - 10 PM': { revenue: 0, success: 0, failed: 0 },
      '10 PM - 12 AM': { revenue: 0, success: 0, failed: 0 },
    };

    list.forEach((t) => {
      const d = new Date(t.booking_date);
      const hour = d.getHours();
      let slot = '06 PM - 08 PM';
      if (hour >= 10 && hour < 12) slot = '10 AM - 12 PM';
      else if (hour >= 12 && hour < 14) slot = '12 PM - 02 PM';
      else if (hour >= 14 && hour < 16) slot = '02 PM - 04 PM';
      else if (hour >= 16 && hour < 18) slot = '04 PM - 06 PM';
      else if (hour >= 18 && hour < 20) slot = '06 PM - 08 PM';
      else if (hour >= 20 && hour < 22) slot = '08 PM - 10 PM';
      else slot = '10 PM - 12 AM';

      if (t.payment_status === 'success') {
        totalGross += t.amount;
        successCount++;
        if (hourlyMap[slot]) {
          hourlyMap[slot].revenue += t.amount;
          hourlyMap[slot].success += 1;
        }
      } else if (t.payment_status === 'failed') {
        failedCount++;
        const reason = t.unmappedstatus || 'User Cancelled in UPI App';
        if (!failuresMap[reason]) {
          let code = 'E001';
          if (reason.includes('PIN') || reason.includes('Auth')) code = 'E002';
          else if (reason.includes('Timeout') || reason.includes('Bank') || reason.includes('NPCI')) code = 'E003';
          else if (reason.includes('Balance') || reason.includes('Limit')) code = 'E004';
          failuresMap[reason] = { count: 0, code };
        }
        failuresMap[reason].count += 1;
        if (hourlyMap[slot]) {
          hourlyMap[slot].failed += 1;
        }
      }
    });

    const totalInitiated = successCount + failedCount;
    const conversionRate = totalInitiated > 0 ? (successCount / totalInitiated) * 100 : 100;
    const averageTransactionValue = successCount > 0 ? totalGross / successCount : 0;

    const failureBreakdown = Object.keys(failuresMap).map((reason) => {
      const count = failuresMap[reason].count;
      const pct = failedCount > 0 ? (count / failedCount) * 100 : 0;
      return {
        reason,
        count,
        percentage: Math.round(pct * 10) / 10,
        code: failuresMap[reason].code,
      };
    });

    // Sort failures descending
    failureBreakdown.sort((a, b) => b.count - a.count);

    const hourlyDistribution = Object.keys(hourlyMap).map((slot) => ({
      hour_label: slot,
      revenue: hourlyMap[slot].revenue,
      success_count: hourlyMap[slot].success,
      failed_count: hourlyMap[slot].failed,
    }));

    return {
      total_gross_volume: totalGross,
      successful_transactions: successCount,
      failed_transactions: failedCount,
      total_initiated: totalInitiated,
      average_transaction_value: Math.round(averageTransactionValue * 100) / 100,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      failure_breakdown: failureBreakdown,
      hourly_distribution: hourlyDistribution,
    };
  }
}

export const analyticsStore = new AnalyticsStore();
