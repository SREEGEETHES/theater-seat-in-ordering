import { MenuItem } from '../types';
import { MOCK_MENU } from '../data/mockMenu';

const MENU_STORAGE_KEY = 'cinesnack_custom_menu_v1';
const MENU_BROADCAST_CHANNEL = 'cinesnack_menu_events';

class MenuStore {
  private menu: MenuItem[] = [];
  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MENU_STORAGE_KEY);
        if (stored) {
          this.menu = JSON.parse(stored);
        } else {
          this.menu = MOCK_MENU;
          this.saveToStorage();
        }
      } catch {
        this.menu = MOCK_MENU;
      }

      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(MENU_BROADCAST_CHANNEL);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'MENU_UPDATED') {
            this.reloadFromStorage();
          }
        };
      }
    } else {
      this.menu = MOCK_MENU;
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(this.menu));
    }
    this.notify();
  }

  private reloadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MENU_STORAGE_KEY);
        if (stored) {
          this.menu = JSON.parse(stored);
          this.notify();
        }
      } catch {
        // silent
      }
    }
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public getMenu(theaterId?: string): MenuItem[] {
    if (theaterId) {
      const theaterItems = this.menu.filter((item) => !item.theater_id || item.theater_id === theaterId);
      return theaterItems.length > 0 ? theaterItems : [...this.menu];
    }
    return [...this.menu];
  }

  public getItemById(id: string): MenuItem | undefined {
    return this.menu.find((item) => item.id === id);
  }

  public addMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.menu.unshift(newItem);
    this.saveToStorage();
    this.broadcastChannel?.postMessage({ type: 'MENU_UPDATED' });
    return newItem;
  }

  public updateMenuItem(id: string, updated: Partial<MenuItem>): boolean {
    const idx = this.menu.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.menu[idx] = {
        ...this.menu[idx],
        ...updated,
      };
      this.saveToStorage();
      this.broadcastChannel?.postMessage({ type: 'MENU_UPDATED' });
      return true;
    }
    return false;
  }

  public deleteMenuItem(id: string): boolean {
    const prevLength = this.menu.length;
    this.menu = this.menu.filter((i) => i.id !== id);
    if (this.menu.length !== prevLength) {
      this.saveToStorage();
      this.broadcastChannel?.postMessage({ type: 'MENU_UPDATED' });
      return true;
    }
    return false;
  }

  public resetToDefaultMenu() {
    this.menu = MOCK_MENU;
    this.saveToStorage();
    this.broadcastChannel?.postMessage({ type: 'MENU_UPDATED' });
  }
}

export const menuStore = new MenuStore();
