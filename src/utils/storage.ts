import { Order, OrderProgressStatus, PaymentStatus } from '../types';
import { soundManager } from './audio';
import { printerStore } from './printerStore';

const STORAGE_KEY = 'cinesnack_orders_saas_v2';
const BROADCAST_CHANNEL_NAME = 'cinesnack_realtime_events';

// Default initial sample orders per theater
const INITIAL_SAMPLE_ORDERS: Order[] = [
  {
    order_id: '#10924',
    theater_id: 'th_grand_cineplex',
    theater_name: 'Grand Cineplex (Downtown IMAX)',
    token_number: 84,
    screen_number: 'Screen 02',
    seat_location: 'M-14',
    delivery_mode: 'SEAT_SERVICE',
    payment_status: 'PAID',
    progress_status: 'PREPARING',
    order_timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    time_display: '07:15 PM',
    customer_name: 'Rahul K',
    customer_phone: '9876543210',
    total_amount: 360,
    upi_txn_id: 'NPCI908123984712',
    items: [
      { name: 'Cheese Popcorn', quantity: 1, price: 240, size: 'Large (250g)' },
      { name: 'Chilled Pepsi Fountain Soda', quantity: 1, price: 120, size: 'Regular (400ml)' },
    ],
  },
  {
    order_id: '#10925',
    theater_id: 'th_grand_cineplex',
    theater_name: 'Grand Cineplex (Downtown IMAX)',
    token_number: 85,
    screen_number: 'Audi 3',
    seat_location: 'F-12',
    delivery_mode: 'SEAT_SERVICE',
    payment_status: 'PAID',
    progress_status: 'RECEIVED',
    order_timestamp: new Date(Date.now() - 1 * 60000).toISOString(),
    time_display: '07:18 PM',
    customer_name: 'Ananya Sharma',
    customer_phone: '9845123456',
    total_amount: 499,
    upi_txn_id: 'NPCI908123984713',
    items: [
      { name: 'Blockbuster Duo Combo', quantity: 1, price: 499 },
    ],
  },
  {
    order_id: '#10926',
    theater_id: 'th_snackbox_koramangala',
    theater_name: 'Snack Box Cinemas',
    token_number: 86,
    screen_number: 'Screen 1',
    seat_location: 'Counter',
    delivery_mode: 'COUNTER_PICKUP',
    payment_status: 'PAID',
    progress_status: 'READY_OR_DISPATCHED',
    order_timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    time_display: '07:10 PM',
    customer_name: 'Vikram Mehta',
    customer_phone: '9920011223',
    total_amount: 220,
    upi_txn_id: 'NPCI908123984714',
    items: [
      { name: 'Loaded Cheesy Jalapeño Nachos', quantity: 1, price: 220 },
    ],
  },
];

class OrderStore {
  private orders: Order[] = [];
  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private currentDailyToken: number = 86;
  private eventSource: EventSource | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.orders = JSON.parse(stored);
          const maxToken = Math.max(...this.orders.map(o => o.token_number || 0), 86);
          this.currentDailyToken = maxToken;
        } else {
          this.orders = INITIAL_SAMPLE_ORDERS;
          this.saveToStorage();
        }
      } catch {
        this.orders = INITIAL_SAMPLE_ORDERS;
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

  public getNextTokenNumber(): number {
    this.currentDailyToken = (this.currentDailyToken % 200) + 1;
    return this.currentDailyToken;
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

  public resetToSample() {
    this.orders = INITIAL_SAMPLE_ORDERS;
    this.currentDailyToken = 86;
    this.saveToStorage();
    this.broadcastChannel?.postMessage({ type: 'ORDER_UPDATE' });
  }
}

export const orderStore = new OrderStore();

