-- ==========================================================
-- SNACK BOX BY N4X - SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- Run this in your Supabase Dashboard -> SQL Editor -> Click "Run"
-- ==========================================================

-- 1. Create Theaters Table (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.theaters (
  theater_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  city VARCHAR(100),
  address TEXT,
  admin_username VARCHAR(100) NOT NULL,
  admin_password VARCHAR(255) NOT NULL,
  payee_vpa VARCHAR(128) NOT NULL DEFAULT 'jaspritsreea-1@okaxis',
  legal_business_name VARCHAR(255) DEFAULT 'Snack Box Cinemas',
  company_pan VARCHAR(50) DEFAULT 'AAACS9012K',
  gstin VARCHAR(50) DEFAULT '29AAACS9012K1Z5',
  bank_account_number VARCHAR(100) DEFAULT '920020019283741',
  bank_ifsc VARCHAR(50) DEFAULT 'UTIB0000123',
  bank_name VARCHAR(100) DEFAULT 'Axis Bank',
  settlement_schedule VARCHAR(100) DEFAULT 'T+1 Daily Auto-Settlement',
  mdr_rate VARCHAR(50) DEFAULT 'Direct Bank Settlement',
  kyc_status VARCHAR(30) DEFAULT 'VERIFIED',
  payu_merchant_key VARCHAR(100) DEFAULT 'gtKFFx',
  payu_merchant_salt VARCHAR(100) DEFAULT '4R38GAP5sm',
  payu_environment VARCHAR(30) DEFAULT 'test',
  printer_host VARCHAR(64) DEFAULT '192.168.1.188',
  printer_port INT DEFAULT 9100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Master Admin & MFA Credentials Table
CREATE TABLE IF NOT EXISTS public.master_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL DEFAULT 'Sreegeethesh (Gateway Master)',
  mfa_secret VARCHAR(255),
  mfa_enabled BOOLEAN DEFAULT FALSE,
  backup_codes JSONB DEFAULT '[]'::jsonb,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Orders Table (With daily token tracking)
CREATE TABLE IF NOT EXISTS public.orders (
  order_id VARCHAR(64) PRIMARY KEY,
  theater_id VARCHAR(64) REFERENCES public.theaters(theater_id) ON DELETE CASCADE,
  token_number INT NOT NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  screen_number VARCHAR(64) NOT NULL,
  seat_location VARCHAR(32) NOT NULL,
  delivery_mode VARCHAR(32) DEFAULT 'SEAT_SERVICE',
  payment_status VARCHAR(32) DEFAULT 'PAID',
  progress_status VARCHAR(32) DEFAULT 'RECEIVED',
  total_amount NUMERIC(10, 2) NOT NULL,
  customer_name VARCHAR(128),
  customer_phone VARCHAR(20),
  upi_txn_id VARCHAR(128),
  time_display VARCHAR(32),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  order_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint ensuring daily token numbering resets to #1 each midnight per theater
CREATE UNIQUE INDEX IF NOT EXISTS idx_theater_daily_token 
ON public.orders (theater_id, order_date, token_number);

-- 4. Create PayU & UPI Transactions Ledger Table
CREATE TABLE IF NOT EXISTS public.payu_transactions (
  txnid VARCHAR(128) PRIMARY KEY,
  order_id VARCHAR(64),
  theater_id VARCHAR(64) REFERENCES public.theaters(theater_id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_status VARCHAR(32) NOT NULL,
  unmappedstatus VARCHAR(255),
  upi_app VARCHAR(64) DEFAULT 'UPI Intent',
  bank_ref_num VARCHAR(128),
  mihpayid VARCHAR(128),
  customer_name VARCHAR(128),
  customer_phone VARCHAR(20),
  screen_number VARCHAR(64),
  seat_location VARCHAR(32),
  settlement_status VARCHAR(32) DEFAULT 'settled',
  hash VARCHAR(255),
  booking_date TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Seed Initial Theaters with your personal UPI ID: jaspritsreea-1@okaxis
INSERT INTO public.theaters (
  theater_id, name, tagline, city, address, 
  admin_username, admin_password, payee_vpa, legal_business_name
) VALUES 
(
  'th_grand_cineplex',
  'Grand Cineplex (Downtown IMAX)',
  'Premier Laser IMAX & Dolby Atmos Cinema',
  'Bengaluru',
  '4th Floor, Forum Mall, Koramangala, Bengaluru, Karnataka 560095',
  'admin_grand',
  'grand@123',
  'jaspritsreea-1@okaxis',
  'Grand Cineplex Private Limited'
),
(
  'th_snackbox_koramangala',
  'Snack Box Cinemas',
  'Smart In-Seat Dine-in Audi',
  'Bengaluru',
  '80 Feet Road, 4th Block, Koramangala, Bengaluru 560034',
  'admin_snackbox',
  'admin@123',
  'jaspritsreea-1@okaxis',
  'N4X Snack Box Entertainment'
),
(
  'th_star_cinema',
  'Star Cineplex',
  'Luxury VIP Recliners & 4DX Screen',
  'Chennai',
  'Express Avenue Mall, Royapettah, Chennai 600014',
  'admin_star',
  'star@123',
  'jaspritsreea-1@okaxis',
  'Star Cineplex Entertainment'
)
ON CONFLICT (theater_id) DO UPDATE SET
  payee_vpa = EXCLUDED.payee_vpa;

-- 6. Seed Master Admin
INSERT INTO public.master_admin (
  username, password_hash, display_name, mfa_secret, mfa_enabled
) VALUES (
  'Sreegeethesh',
  'Sree@9345662166',
  'Sreegeethesh (Gateway Master)',
  'JBSWY3DPEHPK3PXP',
  TRUE
)
ON CONFLICT (username) DO NOTHING;

-- 7. Disable Row Level Security (or grant public access for API service role)
ALTER TABLE public.theaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payu_transactions ENABLE ROW LEVEL SECURITY;

-- Allow read & write policies for anon and service_role
CREATE POLICY "Allow anon read theaters" ON public.theaters FOR SELECT USING (true);
CREATE POLICY "Allow service_role all theaters" ON public.theaters FOR ALL USING (true);

CREATE POLICY "Allow service_role all master_admin" ON public.master_admin FOR ALL USING (true);

CREATE POLICY "Allow anon insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow service_role all orders" ON public.orders FOR ALL USING (true);

CREATE POLICY "Allow anon all transactions" ON public.payu_transactions FOR ALL USING (true);

-- 8. Create Menu Items Table (Live cross-device menu & price sync)
CREATE TABLE IF NOT EXISTS public.menu_items (
  id VARCHAR(64) PRIMARY KEY,
  theater_id VARCHAR(64) REFERENCES public.theaters(theater_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image TEXT,
  is_veg BOOLEAN DEFAULT TRUE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  calories VARCHAR(64),
  prep_time_minutes INT DEFAULT 3,
  sizes JSONB DEFAULT '[]'::jsonb,
  flavors JSONB DEFAULT '[]'::jsonb,
  available BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow anon all menu_items" ON public.menu_items FOR ALL USING (true);
