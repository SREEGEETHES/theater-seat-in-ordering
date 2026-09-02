export type DeliveryMode = 'SEAT_SERVICE' | 'COUNTER_PICKUP';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type OrderProgressStatus = 'RECEIVED' | 'PREPARING' | 'READY_OR_DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface MerchantKYC {
  legal_business_name: string;
  theater_owner_email: string; // e.g. "finance@grandmultiplex.in"
  company_pan: string; // e.g. "ABCDE1234F"
  gstin: string; // e.g. "29ABCDE1234F1Z5"
  bank_account_number: string;
  bank_ifsc: string;
  bank_name: string;
  payee_vpa: string; // e.g. "grandcineplex.snacks@icici"
  settlement_schedule: string; // "T+2 Days (Direct Bank Clearing)"
  mdr_rate: string; // "0.00% (Standard UPI)"
  kyc_status: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

export interface PayUConfig {
  merchant_key: string;
  merchant_salt: string; // Encrypted in storage
  is_encrypted: boolean;
  environment: 'production' | 'test';
  payu_checkout_url: string; // https://secure.payu.in/_payment or https://test.payu.in/_payment
  webhook_url: string; // SaaS Edge Webhook Endpoint
  is_verified: boolean;
}

export interface TheaterScreen {
  id: string;
  name: string; // e.g. "Audi 3 (Dolby Atmos)"
  rows: string[]; // e.g. ["A", "B", "C", "D", "E", "F", "G"]
  seatsPerRow: number; // e.g. 16
}

export interface TheaterAdminCredentials {
  username: string;
  password: string; // Stored securely in theater store
}

export type AdminRole = 'MASTER_ADMIN' | 'THEATER_ADMIN';

export interface AdminSession {
  role: AdminRole;
  username: string;
  theater_id?: string;
  theater_name?: string;
  login_timestamp: string;
}

export interface Theater {
  theater_id: string; // e.g. "th_grand_cineplex"
  name: string; // e.g. "Grand Cineplex (Downtown IMAX)"
  tagline: string;
  city: string;
  address: string;
  logo_icon: string;
  admin_credentials?: TheaterAdminCredentials;
  kyc: MerchantKYC;
  payu: PayUConfig;
  printer: {
    host: string;
    port: number;
    auto_print: boolean;
    header_name: string;
  };
  screens: TheaterScreen[];
  created_at: string;
}

export interface MenuItem {
  id: string;
  theater_id?: string;
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
  theater_id?: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedFlavor?: string;
  isVeg: boolean;
  image: string;
}

export interface SeatLocation {
  theater_id?: string;
  theater_name?: string;
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
  theater_id?: string;           // e.g. "th_grand_cineplex"
  theater_name?: string;
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
  payu_mihpayid?: string;
  payu_bank_ref_num?: string;
  notes?: string;
  printed_at?: string;
  print_status?: 'PRINTED' | 'FAILED' | 'QUEUED';
}

export interface PayUPaymentRequest {
  theater_id: string;
  order_id: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  screen_number: string;
  seat_location: string;
  delivery_mode: DeliveryMode;
  token_number: number;
}

export interface PayUPaymentResponse {
  success: boolean;
  txnid: string;
  order_id: string;
  theater_id: string;
  key: string;
  hash: string;
  amount: string;
  action_url: string;
  upi_intent_uri: string;
  payee_vpa: string;
  payee_name: string;
  mdr_rate: string;
  params: Record<string, string>;
}

export interface WebhookQueueJob {
  job_id: string;
  theater_id: string;
  order_id: string;
  txnid: string;
  amount: number;
  status: string;
  signature_verified: boolean;
  received_at: string;
  queued_duration_ms: number;
  processed_at?: string;
  print_dispatched: boolean;
  raw_payload: any;
}

export interface PayUTransactionRecord {
  txnid: string;
  order_id: string;
  theater_id: string;
  booking_date: string;
  amount: number;
  payment_status: 'success' | 'failed' | 'pending';
  unmappedstatus?: string; // e.g. 'User Cancelled in UPI App', 'Wrong UPI PIN', 'Bank Server Timeout', 'Insufficient Funds'
  upi_app?: 'Google Pay' | 'PhonePe' | 'Paytm' | 'BHIM UPI' | 'CRED' | 'Direct UPI';
  bank_ref_num?: string; // UTR / RRN
  mihpayid?: string;
  customer_name?: string;
  customer_phone?: string;
  screen_number?: string;
  seat_location?: string;
  settlement_status: 'settled' | 'pending' | 'processing';
  hash?: string;
}

export interface UPIAnalyticsMetrics {
  total_gross_volume: number;
  successful_transactions: number;
  failed_transactions: number;
  total_initiated: number;
  average_transaction_value: number;
  conversion_rate: number;
  failure_breakdown: {
    reason: string;
    count: number;
    percentage: number;
    code: string;
  }[];
  hourly_distribution: {
    hour_label: string;
    revenue: number;
    success_count: number;
    failed_count: number;
  }[];
}


