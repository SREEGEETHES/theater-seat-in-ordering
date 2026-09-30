import { CartItem } from '../types';

const CART_STORAGE_KEY = 'cinesnack_customer_cart_v2';
const CART_TTL_MS = 20 * 60 * 1000; // 20 minutes intermission window

export interface StoredCart {
  items: CartItem[];
  theater_id?: string;
  updated_at: number; // epoch ms
}

class CartStore {
  private items: CartItem[] = [];
  private theaterId: string | undefined = undefined;
  private lastUpdated: number = Date.now();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed: StoredCart = JSON.parse(stored);
        const age = Date.now() - (parsed.updated_at || 0);

        // Intermission Cart TTL Check: If older than 20 minutes, purge stale cart
        if (age > CART_TTL_MS) {
          console.warn('[CartStore] Cart expired past 20-min intermission TTL window. Auto-purging.');
          this.items = [];
          this.theaterId = undefined;
          this.lastUpdated = Date.now();
          this.saveToStorage();
        } else {
          this.items = Array.isArray(parsed.items) ? parsed.items : [];
          this.theaterId = parsed.theater_id;
          this.lastUpdated = parsed.updated_at || Date.now();
        }
      }
    } catch {
      this.items = [];
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const payload: StoredCart = {
        items: this.items,
        theater_id: this.theaterId,
        updated_at: this.lastUpdated,
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
    } catch {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getItems(): CartItem[] {
    // Also verify TTL on read
    if (this.items.length > 0 && Date.now() - this.lastUpdated > CART_TTL_MS) {
      this.clearCart();
      return [];
    }
    return [...this.items];
  }

  public getTheaterId(): string | undefined {
    return this.theaterId;
  }

  public setTheaterId(id: string | undefined) {
    if (this.theaterId && id && this.theaterId !== id) {
      // Theater changed (e.g. customer moved to a different cinema)
      this.clearCart();
    }
    this.theaterId = id;
  }

  public addItem(item: CartItem) {
    this.lastUpdated = Date.now();
    const existingIndex = this.items.findIndex(
      (i) =>
        i.menuItemId === item.menuItemId &&
        i.selectedSize === item.selectedSize &&
        i.selectedFlavor === item.selectedFlavor
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += item.quantity;
    } else {
      this.items.push(item);
    }
    this.saveToStorage();
  }

  public updateQuantity(id: string, delta: number) {
    this.lastUpdated = Date.now();
    this.items = this.items
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    this.saveToStorage();
  }

  public removeItem(id: string) {
    this.lastUpdated = Date.now();
    this.items = this.items.filter((i) => i.id !== id);
    this.saveToStorage();
  }

  public clearCart() {
    this.items = [];
    this.lastUpdated = Date.now();
    this.saveToStorage();
  }

  public getRemainingTtlSeconds(): number {
    if (this.items.length === 0) return 0;
    const elapsed = Date.now() - this.lastUpdated;
    const remaining = Math.max(0, CART_TTL_MS - elapsed);
    return Math.floor(remaining / 1000);
  }
}

export const cartStore = new CartStore();
