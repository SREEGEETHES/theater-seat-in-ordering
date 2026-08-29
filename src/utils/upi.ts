import { Order } from '../types';

export interface UPIAppOption {
  id: string;
  name: string;
  iconBg: string;
  color: string;
  packageScheme: string;
  badge?: string;
}

export const SUPPORTED_UPI_APPS: UPIAppOption[] = [
  {
    id: 'gpay',
    name: 'Google Pay',
    iconBg: 'bg-white',
    color: '#4285F4',
    packageScheme: 'gpay://upi/pay',
    badge: 'Fastest',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    iconBg: 'bg-purple-600',
    color: '#5f259f',
    packageScheme: 'phonepe://pay',
    badge: 'Popular',
  },
  {
    id: 'paytm',
    name: 'Paytm UPI',
    iconBg: 'bg-sky-500',
    color: '#00baf2',
    packageScheme: 'paytmmp://pay',
  },
  {
    id: 'bhim',
    name: 'BHIM UPI',
    iconBg: 'bg-emerald-600',
    color: '#00833e',
    packageScheme: 'bhim://pay',
    badge: 'Govt / NPCI',
  },
  {
    id: 'cred',
    name: 'CRED UPI',
    iconBg: 'bg-neutral-900',
    color: '#1a1a1a',
    packageScheme: 'cred://upi',
  },
];

export const THEATER_VPA = 'grandcineplex.snacks@icici';
export const THEATER_NAME = 'Grand Cineplex F&B Ltd';

/**
 * Builds standard NPCI-compliant UPI Intent URI
 * Strictly configured for zero-MDR direct bank-to-bank settlement
 */
export function generateUPIIntentUri(order: Order): string {
  const params = new URLSearchParams({
    pa: THEATER_VPA,
    pn: THEATER_NAME,
    am: order.total_amount.toFixed(2),
    cu: 'INR',
    tn: `Cinema Food Token #${order.token_number} - ${order.screen_number} ${order.seat_location}`,
    tr: `TXN${order.order_id.replace('#', '')}_${Date.now().toString().slice(-4)}`,
    mode: '00', // standard direct peer-to-merchant
    orgid: '159001',
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Technical specification for 0% MDR gateway payload
 */
export function getZeroMdrGatewayPayload(order: Order) {
  return {
    order_id: order.order_id,
    amount: order.total_amount * 100, // in paise
    currency: 'INR',
    payee_vpa: THEATER_VPA,
    payee_name: THEATER_NAME,
    method: ['upi'],
    upi_options: {
      credit_card: false,   // Strictly disables RuPay CC on UPI to avoid 1.99% fee
      prepaid_wallet: false // Strictly disables PPI Wallets (Paytm/Amazon wallet) to avoid 1.1% fee
    },
    webhook_url: 'https://api.grandcineplex.com/api/v1/upi/webhook',
    metadata: {
      screen_number: order.screen_number,
      seat_location: order.seat_location,
      delivery_mode: order.delivery_mode,
      token_number: order.token_number,
    },
  };
}
