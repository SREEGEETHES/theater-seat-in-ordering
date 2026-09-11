import { Order, OrderProgressStatus, PaymentStatus } from '../types';
import { soundManager } from './audio';
import { printerStore } from './printerStore';

const STORAGE_KEY = 'cinesnack_orders_saas_v3';
const DAILY_TOKEN_STORAGE_KEY = 'snackbox_daily_token_tracker_v3';
const BROADCAST_CHANNEL_NAME = 'cinesnack_realtime_events';

// Helper to get local date in YYYY-MM-DD format
function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

class OrderStore {
  private orders: Order[] = [];
  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: Order[] = JSON.parse(stored);
          // Filter out legacy sample simulation orders
          this.orders = parsed.filter(o => 
            o.order_id !== '#10924' && 
            o.order_id !== '#10925' && 
            o.order_id !== '#10926' &&
            o.customer_name !== 'Simulated Cinema Guest'
          );
        } else {
          this.orders = [];
          this.saveToStorage();
        }
      } catch {
        this.orders = [];
      }

      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'ORDER_UPDATE') {
            this.reloadFromStorage();
          } else if (event.data?.type === 'NEW_PAID_ORDER') {
            this.reloadFromStorage();
            soundManager.playNewOrderChime();
          }
        };
      }

      // Connect to real-time Server-Sent Events (SSE) stream from backend
      this.initEventSource();
    }
  }

  private initEventSource() {
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        this.eventSource = new EventSource('/api/events');
        this.eventSource.addEventListener('order:paid', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.order_id) {
              this.markOrderAsPaidViaWebhook(data.order_id, data.txnid || `NPCI_${Date.now()}`);
            }
          } catch {}
        });
      }
    } catch {}
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
    }
    this.notify();
  }

  private reloadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.orders = JSON.parse(stored);
          this.notify();
        }
      } catch {}
    }
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public getOrders(theaterId?: string): Order[] {
    if (theaterId) {
      return this.orders.filter((o) => o.theater_id === theaterId);
    }
    return [...this.orders];
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.find(o => o.order_id === id);
  }

  /**
   * Generates the next sequential token number for today.
   * Resets every midnight so the first order of each new day begins strictly at 1.
   * For example, if today ends at 97 orders, tomorrow's first order starts at 1.
   */
  public getNextTokenNumber(): number {
    const todayStr = getLocalDateString();
    let lastRecordedToken = 0;

    if (typeof window !== 'undefined') {
      try {
        const storedTracker = localStorage.getItem(DAILY_TOKEN_STORAGE_KEY);
        if (storedTracker) {
          const parsed = JSON.parse(storedTracker);
          if (parsed && parsed.date === todayStr && typeof parsed.lastToken === 'number') {
            lastRecordedToken = parsed.lastToken;
          }
        }
      } catch {}
    }

    // Also inspect today's real orders in memory/storage to ensure perfect sync
    const todaysOrders = this.orders.filter((o) => {
      if (!o.order_timestamp) return false;
      const orderDateStr = getLocalDateString(new Date(o.order_timestamp));
      return orderDateStr === todayStr;
    });

    const maxExistingToday = todaysOrders.reduce((max, o) => Math.max(max, o.token_number || 0), 0);
    const nextToken = Math.max(lastRecordedToken, maxExistingToday) + 1;

    // Persist today's updated token pointer
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          DAILY_TOKEN_STORAGE_KEY,
          JSON.stringify({ date: todayStr, lastToken: nextToken })
        );
      } catch {}
    }

    return nextToken;
  }

  public createOrder(orderData: Omit<Order, 'order_id' | 'token_number' | 'order_timestamp' | 'time_display'>): Order {
    const nextToken = this.getNextTokenNumber();
    const now = new Date();
    const orderId = `#${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      ...orderData,
      theater_id: orderData.theater_id || 'th_grand_cineplex',
      order_id: orderId,
      token_number: nextToken,
      order_timestamp: now.toISOString(),
      time_display: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    this.orders.unshift(newOrder);
    this.saveToStorage();

    this.broadcastChannel?.postMessage({
      type: newOrder.payment_status === 'PAID' ? 'NEW_PAID_ORDER' : 'ORDER_UPDATE',
      order: newOrder,
    });

    if (newOrder.payment_status === 'PAID') {
      soundManager.playNewOrderChime();
    }

    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderProgressStatus, paymentStatus?: PaymentStatus) {
    const idx = this.orders.findIndex(o => o.order_id === orderId);
    if (idx !== -1) {
      this.orders[idx] = {
        ...this.orders[idx],
        progress_status: status,
        payment_status: paymentStatus || this.orders[idx].payment_status,
      };
      this.saveToStorage();
      this.broadcastChannel?.postMessage({ type: 'ORDER_UPDATE' });
    }
  }

  public markOrderAsPaidViaWebhook(orderId: string, upiTxnId: string): Order | null {
    const idx = this.orders.findIndex(o => o.order_id === orderId);
    if (idx !== -1) {
      this.orders[idx] = {
        ...this.orders[idx],
        payment_status: 'PAID',
        progress_status: 'RECEIVED',
        upi_txn_id: upiTxnId,
      };
      const paidOrder = this.orders[idx];
      this.saveToStorage();
      this.broadcastChannel?.postMessage({ type: 'NEW_PAID_ORDER', order: paidOrder });
      soundManager.playNewOrderChime();

      // Trigger automatic thermal print job if enabled
      if (printerStore.getConfig().autoPrintOnPayment) {
        printerStore.dispatchPrintJob(paidOrder).catch(console.warn);
      }

      return paidOrder;
    }
    return null;
  }

  public clearAllOrders() {
    this.orders = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      const todayStr = getLocalDateString();
      localStorage.setItem(
        DAILY_TOKEN_STORAGE_KEY,
        JSON.stringify({ date: todayStr, lastToken: 0 })
      );
    }
    this.saveToStorage();
    this.broadcastChannel?.postMessage({ type: 'ORDER_UPDATE' });
  }
}

export const orderStore = new OrderStore();

