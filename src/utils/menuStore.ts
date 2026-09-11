import { MenuItem } from '../types';
import { MOCK_MENU } from '../data/mockMenu';
import { getClientSupabase } from './supabaseClient';

const MENU_STORAGE_KEY = 'cinesnack_custom_menu_v1';
const MENU_BROADCAST_CHANNEL = 'cinesnack_menu_events';

class MenuStore {
  private menu: MenuItem[] = [];
  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isFetching: boolean = false;

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

      // Automatically sync latest live menu from server/database on load
      this.fetchMenuFromServer().catch(() => {});
    } else {
      this.menu = MOCK_MENU;
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(this.menu));
      } catch {}
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
      } catch {}
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

  /**
   * Fetches the latest live menu from the backend API or Supabase PostgreSQL database.
   * Ensures customer phones scanning QR codes see immediate price/menu changes.
   */
  public async fetchMenuFromServer(theaterId?: string): Promise<MenuItem[]> {
    if (this.isFetching) return this.getMenu(theaterId);
    this.isFetching = true;

    try {
      // 1. Try fetching from centralized server API
      const url = theaterId ? `/api/menu?theater_id=${encodeURIComponent(theaterId)}` : '/api/menu';
      const res = await fetch(url).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          this.menu = data.items;
          this.saveToStorage();
          this.isFetching = false;
          return this.getMenu(theaterId);
        }
      }

      // 2. Fallback for static Vercel deployments: query Supabase directly
      const supabase = getClientSupabase();
      if (supabase) {
        let query = supabase.from('menu_items').select('*');
        if (theaterId) {
          query = query.or(`theater_id.eq.${theaterId},theater_id.is.null`);
        }
        const { data: dbItems, error } = await query;
        if (!error && dbItems && dbItems.length > 0) {
          const mapped: MenuItem[] = dbItems.map((item: any) => ({
            id: item.id,
            theater_id: item.theater_id || undefined,
            name: item.name,
            category: item.category,
            description: item.description || '',
            price: Number(item.price),
            image: item.image || '',
            isVeg: item.is_veg ?? true,
            isBestseller: item.is_bestseller ?? false,
            calories: item.calories || undefined,
            prepTimeMinutes: item.prep_time_minutes || 3,
            sizes: Array.isArray(item.sizes) ? item.sizes : [],
            flavors: Array.isArray(item.flavors) ? item.flavors : [],
          }));
          this.menu = mapped;
          this.saveToStorage();
          this.isFetching = false;
          return this.getMenu(theaterId);
        }
      }
    } catch (e) {
      console.warn('Live menu sync notice: using cached local menu', e);
    } finally {
      this.isFetching = false;
    }

    return this.getMenu(theaterId);
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

  public async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.menu.unshift(newItem);
    this.saveToStorage();
    this.broadcastChannel?.postMessage({ type: 'MENU_UPDATED' });

    // Sync to server
    try {
      await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
    } catch {
      // Direct Supabase fallback
      const supabase = getClientSupabase();
      if (supabase) {
        supabase.from('menu_items').upsert({
          id: newItem.id,
          theater_id: newItem.theater_id || null,
          name: newItem.name,
          category: newItem.category,
          description: newItem.description,
          price: newItem.price,
          image: newItem.image,
          is_veg: newItem.isVeg,
          is_bestseller: newItem.isBestseller,
          calories: newItem.calories,
          prep_time_minutes: newItem.prepTimeMinutes,
          sizes: newItem.sizes || [],
          flavors: newItem.flavors || [],
        }).then();
      }
    }

    return newItem;
  }

  public async updateMenuItem(id: string, updated: Partial<MenuItem>): Promise<boolean> {
    const idx = this.menu.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.menu[idx] = {
        ...this.menu[idx],
        ...updated,
      };
      this.saveToStorage();
      this.broadcastChannel?.postMessage({ type: 'MENU_UPDATED' });

      // Sync to server
      try {
        await fetch(`/api/menu/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.menu[idx]),
        });
      } catch {
        // Direct Supabase fallback
        const supabase = getClientSupabase();
        if (supabase) {
          const item = this.menu[idx];
          supabase.from('menu_items').upsert({
            id: item.id,
            theater_id: item.theater_id || null,
            name: item.name,
            category: item.category,
            description: item.description,
            price: item.price,
            image: item.image,
            is_veg: item.isVeg,
            is_bestseller: item.isBestseller,
            calories: item.calories,
            prep_time_minutes: item.prepTimeMinutes,
            sizes: item.sizes || [],
            flavors: item.flavors || [],
          }).then();
        }
      }

      return true;
    }
    return false;
  }

  public async deleteMenuItem(id: string): Promise<boolean> {
    const prevLength = this.menu.length;
    this.menu = this.menu.filter((i) => i.id !== id);
    if (this.menu.length !== prevLength) {
      this.saveToStorage();
      this.broadcastChannel?.postMessage({ type: 'MENU_UPDATED' });

      try {
        await fetch(`/api/menu/${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch {
        const supabase = getClientSupabase();
        if (supabase) {
          supabase.from('menu_items').delete().eq('id', id).then();
        }
      }
      return true;
    }
    return false;
  }

  public async resetToDefaultMenu() {
    this.menu = MOCK_MENU;
    this.saveToStorage();
    this.broadcastChannel?.postMessage({ type: 'MENU_UPDATED' });

    try {
      await fetch('/api/menu/reset', { method: 'POST' });
    } catch {}
  }
}

export const menuStore = new MenuStore();
