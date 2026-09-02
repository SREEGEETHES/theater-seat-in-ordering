import { Theater, MerchantKYC, PayUConfig, TheaterAdminCredentials } from '../types';

const THEATERS_STORAGE_KEY = 'cinesnack_theaters_saas_v2';
const ACTIVE_THEATER_KEY = 'cinesnack_active_theater_id';

export const INITIAL_THEATERS: Theater[] = [
  {
    theater_id: 'th_grand_cineplex',
    name: 'Grand Cineplex (Downtown IMAX)',
    tagline: 'Premium Dolby Atmos & Laser IMAX In-Seat Dining',
    city: 'Mumbai',
    address: 'Level 4, Phoenix Palladium, Lower Parel, Mumbai, Maharashtra 400013',
    logo_icon: '🍿',
    admin_credentials: {
      username: 'admin_grand',
      password: 'grand@123',
    },
    kyc: {
      legal_business_name: 'Grand Multiplex Theatres Pvt Ltd',
      theater_owner_email: 'director@grandmultiplex.in',
      company_pan: 'AABCG1234D',
      gstin: '27AABCG1234D1Z8',
      bank_account_number: '920020038491823',
      bank_ifsc: 'HDFC0000128',
      bank_name: 'HDFC Bank Ltd, Lower Parel Branch',
      payee_vpa: 'grandcineplex.fnb@hdfcbank',
      settlement_schedule: 'T+2 Days (Direct Bank Clearing)',
      mdr_rate: '0.00% (Standard Bank-to-Bank UPI)',
      kyc_status: 'VERIFIED',
    },
    payu: {
      merchant_key: 'J7xK9sW2',
      merchant_salt: 'eCwWELxi',
      is_encrypted: true,
      environment: 'production',
      payu_checkout_url: 'https://secure.payu.in/_payment',
      webhook_url: 'https://api.snackbox.in/api/payu/webhook',
      is_verified: true,
    },
    printer: {
      host: 'virtual-printer.online',
      port: 9359,
      auto_print: true,
      header_name: 'GRAND CINEPLEX IMAX',
    },
    screens: [
      { id: 'audi_1', name: 'Audi 1 (IMAX Laser)', rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], seatsPerRow: 18 },
      { id: 'audi_2', name: 'Audi 2 (Dolby Atmos)', rows: ['A', 'B', 'C', 'D', 'E', 'F'], seatsPerRow: 16 },
      { id: 'audi_3', name: 'Audi 3 (VIP Recliner)', rows: ['A', 'B', 'C', 'D', 'E', 'F'], seatsPerRow: 14 },
    ],
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    theater_id: 'th_snackbox_koramangala',
    name: 'Snack Box Cinemas',
    tagline: 'Koramangala 4K 7.1 Surround & In-Seat Dining',
    city: 'Bengaluru',
    address: '80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
    logo_icon: '🍿',
    admin_credentials: {
      username: 'admin_snackbox',
      password: 'admin@123',
    },
    kyc: {
      legal_business_name: 'Snack Box Entertainment LLP',
      theater_owner_email: 'ops@snackboxcinemas.com',
      company_pan: 'AACHM9876K',
      gstin: '29AACHM9876K1Z2',
      bank_account_number: '50100492817264',
      bank_ifsc: 'ICIC0000047',
      bank_name: 'ICICI Bank, Koramangala 4th Block',
      payee_vpa: 'snackbox.upi@icici',
      settlement_schedule: 'T+2 Days (Direct Bank Clearing)',
      mdr_rate: '0.00% (Standard Bank-to-Bank UPI)',
      kyc_status: 'VERIFIED',
    },
    payu: {
      merchant_key: 'M4vP8qT1',
      merchant_salt: 'p8kL2mW9',
      is_encrypted: true,
      environment: 'production',
      payu_checkout_url: 'https://secure.payu.in/_payment',
      webhook_url: 'https://api.snackbox.in/api/payu/webhook',
      is_verified: true,
    },
    printer: {
      host: 'virtual-printer.online',
      port: 9359,
      auto_print: true,
      header_name: 'SNACK BOX KORAMANGALA',
    },
    screens: [
      { id: 'screen_1', name: 'Screen 1 (Main Hall)', rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'], seatsPerRow: 20 },
      { id: 'screen_2', name: 'Screen 2 (Gold Class)', rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 12 },
    ],
    created_at: '2026-08-15T14:30:00Z',
  },
  {
    theater_id: 'th_inox_delhi',
    name: 'CineStar Multiplex',
    tagline: 'Connaught Place Heritage Screen & Dine',
    city: 'New Delhi',
    address: 'Odeon Building, Connaught Place, New Delhi 110001',
    logo_icon: '⭐',
    admin_credentials: {
      username: 'admin_cinestar',
      password: 'cinestar@123',
    },
    kyc: {
      legal_business_name: 'CineStar Capital Cinemas Ltd',
      theater_owner_email: 'management@cinestarmultiplex.com',
      company_pan: 'AABCC5544R',
      gstin: '07AABCC5544R1Z0',
      bank_account_number: '0039050019284',
      bank_ifsc: 'UTIB0000039',
      bank_name: 'Axis Bank, Connaught Place',
      payee_vpa: 'cinestar.cp@axisbank',
      settlement_schedule: 'T+2 Days (Direct Bank Clearing)',
      mdr_rate: '0.00% (Standard Bank-to-Bank UPI)',
      kyc_status: 'VERIFIED',
    },
    payu: {
      merchant_key: 'C7rB2zQ9',
      merchant_salt: 'y3nQ9xT4',
      is_encrypted: true,
      environment: 'production',
      payu_checkout_url: 'https://secure.payu.in/_payment',
      webhook_url: 'https://api.snackbox.in/api/payu/webhook',
      is_verified: true,
    },
    printer: {
      host: 'virtual-printer.online',
      port: 9359,
      auto_print: true,
      header_name: 'CINESTAR CONNAUGHT PLACE',
    },
    screens: [
      { id: 'screen_cp_1', name: 'Screen 1 (Grand Balcony)', rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], seatsPerRow: 22 },
      { id: 'screen_cp_2', name: 'Screen 2 (Silver Audi)', rows: ['A', 'B', 'C', 'D', 'E', 'F'], seatsPerRow: 16 },
    ],
    created_at: '2026-08-20T09:15:00Z',
  },
];

class TheaterStore {
  private theaters: Theater[] = [];
  private activeTheaterId: string = 'th_grand_cineplex';
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedTheaters = localStorage.getItem(THEATERS_STORAGE_KEY);
      if (storedTheaters) {
        const parsed = JSON.parse(storedTheaters) as Theater[];
        // Backfill admin_credentials & theater_owner_email if missing from older localStorage schema
        this.theaters = parsed.map((t) => {
          const initial = INITIAL_THEATERS.find((init) => init.theater_id === t.theater_id);
          return {
            ...t,
            admin_credentials: t.admin_credentials || initial?.admin_credentials || {
              username: `admin_${t.theater_id.replace('th_', '')}`,
              password: 'admin@123',
            },
            kyc: {
              ...t.kyc,
              theater_owner_email: t.kyc?.theater_owner_email || initial?.kyc?.theater_owner_email || `owner@${t.theater_id.replace('th_', '')}.in`,
            },
          };
        });
      } else {
        this.theaters = INITIAL_THEATERS;
        this.saveTheaters();
      }

      const storedActiveId = localStorage.getItem(ACTIVE_THEATER_KEY);
      if (storedActiveId && this.theaters.some((t) => t.theater_id === storedActiveId)) {
        this.activeTheaterId = storedActiveId;
      } else {
        this.activeTheaterId = this.theaters[0]?.theater_id || 'th_grand_cineplex';
        localStorage.setItem(ACTIVE_THEATER_KEY, this.activeTheaterId);
      }
    } catch {
      this.theaters = INITIAL_THEATERS;
      this.activeTheaterId = 'th_grand_cineplex';
    }
  }

  private saveTheaters() {
    try {
      localStorage.setItem(THEATERS_STORAGE_KEY, JSON.stringify(this.theaters));
    } catch (e) {
      console.error('Failed to save theaters to localStorage', e);
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

  public getAllTheaters(): Theater[] {
    return [...this.theaters];
  }

  public getActiveTheaterId(): string {
    return this.activeTheaterId;
  }

  public getActiveTheater(): Theater {
    const found = this.theaters.find((t) => t.theater_id === this.activeTheaterId);
    return found || this.theaters[0] || INITIAL_THEATERS[0];
  }

  public getTheaterById(id: string): Theater | undefined {
    return this.theaters.find((t) => t.theater_id === id);
  }

  public setActiveTheaterId(id: string) {
    if (this.theaters.some((t) => t.theater_id === id)) {
      this.activeTheaterId = id;
      try {
        localStorage.setItem(ACTIVE_THEATER_KEY, id);
      } catch {}
      this.notify();
    }
  }

  public updateTheaterKYC(theaterId: string, kyc: Partial<MerchantKYC>) {
    this.theaters = this.theaters.map((t) => {
      if (t.theater_id === theaterId) {
        return {
          ...t,
          kyc: { ...t.kyc, ...kyc },
        };
      }
      return t;
    });
    this.saveTheaters();
    this.notify();
  }

  public updateTheaterPayU(theaterId: string, payu: Partial<PayUConfig>) {
    this.theaters = this.theaters.map((t) => {
      if (t.theater_id === theaterId) {
        return {
          ...t,
          payu: { ...t.payu, ...payu },
        };
      }
      return t;
    });
    this.saveTheaters();
    this.notify();
  }

  public updateTheaterCredentials(theaterId: string, credentials: Partial<TheaterAdminCredentials>) {
    this.theaters = this.theaters.map((t) => {
      if (t.theater_id === theaterId) {
        return {
          ...t,
          admin_credentials: {
            username: credentials.username || t.admin_credentials?.username || `admin_${theaterId.replace('th_', '')}`,
            password: credentials.password || t.admin_credentials?.password || 'admin@123',
          },
        };
      }
      return t;
    });
    this.saveTheaters();
    this.notify();
  }

  public updateTheaterPrinter(theaterId: string, printer: Partial<Theater['printer']>) {
    this.theaters = this.theaters.map((t) => {
      if (t.theater_id === theaterId) {
        return {
          ...t,
          printer: { ...t.printer, ...printer },
        };
      }
      return t;
    });
    this.saveTheaters();
    this.notify();
  }

  public createNewTheater(newTheater: Omit<Theater, 'created_at'>): Theater {
    const created: Theater = {
      ...newTheater,
      created_at: new Date().toISOString(),
    };
    this.theaters.push(created);
    this.saveTheaters();
    this.setActiveTheaterId(created.theater_id);
    this.notify();
    return created;
  }

  public resetAllTheaters() {
    this.theaters = INITIAL_THEATERS;
    this.activeTheaterId = 'th_grand_cineplex';
    this.saveTheaters();
    localStorage.setItem(ACTIVE_THEATER_KEY, this.activeTheaterId);
    this.notify();
  }
}

export const theaterStore = new TheaterStore();
