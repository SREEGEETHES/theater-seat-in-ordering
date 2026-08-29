export type DeliveryMode = 'SEAT_SERVICE' | 'COUNTER_PICKUP';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type OrderProgressStatus = 'RECEIVED' | 'PREPARING' | 'READY_OR_DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface MenuItem {
  id: string;
  name: string;
  category: 'popcorn' | 'combos' | 'nachos' | 'beverages' | 'hot_bites' | 'desserts';
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  isBestseller?: boolean;
  calories?: string;
  sizes?: { name: string; extraPrice: number }[];
  flavors?: string[];
  prepTimeMinutes: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedFlavor?: string;
  isVeg: boolean;
  image: string;
}

export interface SeatLocation {
  screen: string; // e.g., "Audi 3" or "Screen 02"
  row: string;    // e.g., "F" or "M"
  seat: string;   // e.g., "12" or "14"
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  flavor?: string;
}

export interface Order {
  order_id: string;              // e.g. "#10924"
  token_number: number;          // 1 to 200 daily rotating
  screen_number: string;         // e.g. "Screen 02" or "Audi 3"
  seat_location: string;         // e.g. "M-14" or "F-12"
  delivery_mode: DeliveryMode;   // "SEAT_SERVICE" | "COUNTER_PICKUP"
  payment_status: PaymentStatus; // "PENDING" | "PAID"
  progress_status: OrderProgressStatus;
  order_timestamp: string;       // ISO string or formatted time
  time_display: string;          // e.g. "07:15 PM"
  items: OrderItem[];
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  upi_txn_id?: string;
  upi_ref_no?: string;
  notes?: string;
  printed_at?: string;
}

export interface UPIGatewayPayload {
  order_id: string;
  amount: number;
  payee_vpa: string;
  payee_name: string;
  method: ['upi'];
  upi_options: {
    credit_card: false;
    prepaid_wallet: false;
  };
}
