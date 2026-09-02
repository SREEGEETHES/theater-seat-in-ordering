import { PayUTransactionRecord, UPIAnalyticsMetrics } from '../types';
import { theaterStore } from './theaterStore';
import { orderStore } from './storage';

const ANALYTICS_STORAGE_KEY = 'snackbox_payu_upi_ledger_v1';
const LAST_SYNC_KEY = 'snackbox_payu_last_sync_v1';

// Seed authentic PayU UPI transactions
const SEED_TRANSACTIONS: PayUTransactionRecord[] = [
  {
    txnid: 'TXN_UPI_98471203',
    order_id: '#10926',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    amount: 510.00,
    payment_status: 'success',
    upi_app: 'Google Pay',
    bank_ref_num: '423891028394',
    mihpayid: '18392019482',
    customer_name: 'Ananya Sharma',
    customer_phone: '9845012345',
    screen_number: 'Screen 1',
    seat_location: 'Counter',
    settlement_status: 'settled',
    hash: 'e8f7a93c4b12d5e6f8a90123456789abcdef1234567890abcdef1234567890ab',
  },
  {
    txnid: 'TXN_UPI_98471189',
    order_id: '#10925',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    amount: 720.00,
    payment_status: 'success',
    upi_app: 'PhonePe',
    bank_ref_num: '423891027118',
    mihpayid: '18392018873',
    customer_name: 'Vikram Singh',
    customer_phone: '9876501234',
    screen_number: 'Screen 2',
    seat_location: 'D-08',
    settlement_status: 'settled',
    hash: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
  },
  {
    txnid: 'TXN_UPI_98471150',
    order_id: '#10924',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    amount: 430.00,
    payment_status: 'success',
    upi_app: 'Paytm',
    bank_ref_num: '423891026042',
    mihpayid: '18392017610',
    customer_name: 'Priya Nair',
    customer_phone: '9988776655',
    screen_number: 'Screen 1',
    seat_location: 'F-12',
    settlement_status: 'settled',
    hash: 'f0e1d2c3b4a596871234567890abcdef1234567890abcdef1234567890abcdef',
  },
  {
    txnid: 'TXN_UPI_98471092',
    order_id: '#10923',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 68).toISOString(),
    amount: 340.00,
    payment_status: 'failed',
    unmappedstatus: 'User Cancelled in UPI App',
    upi_app: 'Google Pay',
    mihpayid: '18392016401',
    customer_name: 'Karthik Rao',
    customer_phone: '9741234567',
    screen_number: 'Screen 1',
    seat_location: 'G-14',
    settlement_status: 'pending',
    hash: '7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
  },
  {
    txnid: 'TXN_UPI_98470984',
    order_id: '#10922',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    amount: 890.00,
    payment_status: 'success',
    upi_app: 'CRED',
    bank_ref_num: '423891024892',
    mihpayid: '18392015298',
    customer_name: 'Rohan Mehta',
    customer_phone: '9820192834',
    screen_number: 'Screen 1',
    seat_location: 'H-07',
    settlement_status: 'settled',
    hash: 'bcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890a',
  },
  {
    txnid: 'TXN_UPI_98470870',
    order_id: '#10921',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    amount: 280.00,
    payment_status: 'failed',
    unmappedstatus: 'Wrong UPI PIN / Auth Failure',
    upi_app: 'PhonePe',
    mihpayid: '18392014102',
    customer_name: 'Deepak V',
    customer_phone: '9811223344',
    screen_number: 'Screen 2',
    seat_location: 'B-04',
    settlement_status: 'pending',
  },
  {
    txnid: 'TXN_UPI_98470760',
    order_id: '#10920',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    amount: 650.00,
    payment_status: 'success',
    upi_app: 'BHIM UPI',
    bank_ref_num: '423891022941',
    mihpayid: '18392013098',
    customer_name: 'Sneha Patel',
    customer_phone: '9900112233',
    screen_number: 'Screen 1',
    seat_location: 'E-10',
    settlement_status: 'settled',
  },
  {
    txnid: 'TXN_UPI_98470650',
    order_id: '#10919',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    amount: 450.00,
    payment_status: 'success',
    upi_app: 'Google Pay',
    bank_ref_num: '423891021884',
    mihpayid: '18392011984',
    customer_name: 'Aditya Roy',
    customer_phone: '9833445566',
    screen_number: 'Screen 1',
    seat_location: 'C-08',
    settlement_status: 'settled',
  },
  {
    txnid: 'TXN_UPI_98470510',
    order_id: '#10918',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
    amount: 320.00,
    payment_status: 'failed',
    unmappedstatus: 'Bank Server Timeout / NPCI Busy',
    upi_app: 'Paytm',
    mihpayid: '18392010874',
    customer_name: 'Varun K',
    customer_phone: '9844556677',
    screen_number: 'Screen 2',
    seat_location: 'A-02',
    settlement_status: 'pending',
  },
  {
    txnid: 'TXN_UPI_98470420',
    order_id: '#10917',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 310).toISOString(),
    amount: 580.00,
    payment_status: 'success',
    upi_app: 'PhonePe',
    bank_ref_num: '423891019765',
    mihpayid: '18392009761',
    customer_name: 'Meera Sen',
    customer_phone: '9711223344',
    screen_number: 'Screen 1',
    seat_location: 'J-15',
    settlement_status: 'settled',
  },
  {
    txnid: 'TXN_UPI_98470310',
    order_id: '#10916',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    amount: 490.00,
    payment_status: 'success',
    upi_app: 'Google Pay',
    bank_ref_num: '423891018654',
    mihpayid: '18392008652',
    customer_name: 'Tanvi Joshi',
    customer_phone: '9655443322',
    screen_number: 'Screen 1',
    seat_location: 'D-11',
    settlement_status: 'settled',
  },
  {
    txnid: 'TXN_UPI_98470200',
    order_id: '#10915',
    theater_id: 'th_snackbox_koramangala',
    booking_date: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    amount: 390.00,
    payment_status: 'failed',
    unmappedstatus: 'Insufficient Balance / Limit Exceeded',
    upi_app: 'Google Pay',
    mihpayid: '18392007541',
    customer_name: 'Gaurav Jain',
    customer_phone: '9544332211',
    screen_number: 'Screen 2',
    seat_location: 'E-06',
    settlement_status: 'pending',
  },
];

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
    return this.transactions.filter(
      (t) => t.theater_id === theaterId || t.theater_id === 'th_snackbox_koramangala'
    );
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
