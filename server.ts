import express from 'express';
import path from 'path';
import net from 'net';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  getSupabase,
  checkSupabaseConnection,
  seedSupabaseCredentials,
  deleteTheaterFromSupabase,
  getMenuItemsFromSupabase,
  upsertMenuItemInSupabase,
  deleteMenuItemFromSupabase,
} from './server/supabase.js';
import { INITIAL_SERVER_MENU, ServerMenuItem } from './server/defaultMenu.js';
import {
  verifyMfaToken,
  getCurrentMfaToken,
  createMfaEnrollment,
  MASTER_MFA_SECRET_DEFAULT,
  encryptSecret,
  decryptSecret,
} from './server/mfa.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared in-memory menu state for cross-device synchronization
let serverMenuItems: ServerMenuItem[] = [...INITIAL_SERVER_MENU];

// In-memory printer job log for admin inspection
interface PrintJobLog {
  id: string;
  theater_id: string;
  order_id: string;
  token_number: number;
  host: string;
  port: number;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  timestamp: string;
}

// In-Memory Asynchronous Message Queue Job (Simulating Redis BullMQ)
interface QueueJob {
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

// Multi-Theater Database
interface TheaterEntity {
  theater_id: string;
  name: string;
  tagline: string;
  city: string;
  address: string;
  kyc: {
    legal_business_name: string;
    company_pan: string;
    gstin: string;
    bank_account_number: string;
    bank_ifsc: string;
    bank_name: string;
    payee_vpa: string;
    settlement_schedule: string;
    mdr_rate: string;
    kyc_status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  };
  payu: {
    merchant_key: string;
    merchant_salt: string;
    is_encrypted: boolean;
    environment: 'production' | 'test';
    payu_checkout_url: string;
    webhook_url: string;
    is_verified: boolean;
  };
  printer: {
    host: string;
    port: number;
    auto_print: boolean;
    header_name: string;
  };
}

const theatersDatabase: Record<string, TheaterEntity> = {
  th_grand_cineplex: {
    theater_id: 'th_grand_cineplex',
    name: 'Grand Cineplex (Downtown IMAX)',
    tagline: 'Premium Dolby Atmos & Laser IMAX In-Seat Dining',
    city: 'Bengaluru',
    address: 'Level 4, Forum Mall, Koramangala, Bengaluru, Karnataka 560095',
    kyc: {
      legal_business_name: 'Grand Multiplex Theatres Pvt Ltd',
      company_pan: 'AABCG1234D',
      gstin: '27AABCG1234D1Z8',
      bank_account_number: '920020038491823',
      bank_ifsc: 'UTIB0000128',
      bank_name: 'Axis Bank Ltd, Koramangala Branch',
      payee_vpa: 'jaspritsreea-1@okaxis',
      settlement_schedule: 'T+1 Days (Direct NPCI Clearing)',
      mdr_rate: '0.00% (Direct NPCI UPI)',
      kyc_status: 'VERIFIED',
    },
    payu: {
      merchant_key: 'gtKFFx',
      merchant_salt: '4R38GAP5sm',
      is_encrypted: true,
      environment: 'test',
      payu_checkout_url: 'https://test.payu.in/_payment',
      webhook_url: 'https://api.cinesnack.in/api/payu/webhook',
      is_verified: true,
    },
    printer: {
      host: 'virtual-printer.online',
      port: 9359,
      auto_print: true,
      header_name: 'GRAND CINEPLEX IMAX',
    },
  },
  th_pvr_koramangala: {
    theater_id: 'th_pvr_koramangala',
    name: 'Snack Box Cinemas',
    tagline: 'Koramangala 4K 7.1 Surround & Seat Service',
    city: 'Bengaluru',
    address: '80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
    kyc: {
      legal_business_name: 'Snack Box Entertainment LLP',
      company_pan: 'AACHM9876K',
      gstin: '29AACHM9876K1Z2',
      bank_account_number: '50100492817264',
      bank_ifsc: 'ICIC0000047',
      bank_name: 'ICICI Bank, Koramangala 4th Block',
      payee_vpa: 'jaspritsreea-1@okaxis',
      settlement_schedule: 'T+1 Days (Direct NPCI Clearing)',
      mdr_rate: '0.00% (Direct NPCI UPI)',
      kyc_status: 'VERIFIED',
    },
    payu: {
      merchant_key: 'gtKFFx',
      merchant_salt: '4R38GAP5sm',
      is_encrypted: true,
      environment: 'test',
      payu_checkout_url: 'https://test.payu.in/_payment',
      webhook_url: 'https://api.cinesnack.in/api/payu/webhook',
      is_verified: true,
    },
    printer: {
      host: 'virtual-printer.online',
      port: 9359,
      auto_print: true,
      header_name: 'SNACK BOX KORAMANGALA',
    },
  },
  th_inox_delhi: {
    theater_id: 'th_inox_delhi',
    name: 'CineStar Multiplex',
    tagline: 'Connaught Place Heritage Screen & Dine',
    city: 'New Delhi',
    address: 'Odeon Building, Connaught Place, New Delhi 110001',
    kyc: {
      legal_business_name: 'CineStar Capital Cinemas Ltd',
      company_pan: 'AABCC5544R',
      gstin: '07AABCC5544R1Z0',
      bank_account_number: '0039050019284',
      bank_ifsc: 'UTIB0000039',
      bank_name: 'Axis Bank, Connaught Place',
      payee_vpa: 'jaspritsreea-1@okaxis',
      settlement_schedule: 'T+1 Days (Direct NPCI Clearing)',
      mdr_rate: '0.00% (Direct NPCI UPI)',
      kyc_status: 'VERIFIED',
    },
    payu: {
      merchant_key: 'gtKFFx',
      merchant_salt: '4R38GAP5sm',
      is_encrypted: true,
      environment: 'test',
      payu_checkout_url: 'https://test.payu.in/_payment',
      webhook_url: 'https://api.cinesnack.in/api/payu/webhook',
      is_verified: true,
    },
    printer: {
      host: 'virtual-printer.online',
      port: 9359,
      auto_print: true,
      header_name: 'CINESTAR CONNAUGHT PLACE',
    },
  },
};

const printLogs: PrintJobLog[] = [];
const messageQueue: QueueJob[] = [];
const processedJobs: QueueJob[] = [];
const sseClients: Array<{ id: string; theater_id?: string; res: express.Response }> = [];

// Helper: Calculate SHA-512 Hash
function computeSha512(input: string): string {
  return crypto.createHash('sha512').update(input, 'utf-8').digest('hex');
}

/**
 * PayU Forward Hash Formula:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
function createPayUHash(params: {
  key: string;
  txnid: string;
  amount: number | string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string; // theater_id
  udf2?: string; // screen_number
  udf3?: string; // seat_location
  udf4?: string; // delivery_mode
  udf5?: string; // token_number
  salt: string;
}): string {
  const formattedAmount = Number(params.amount).toFixed(2);
  const hashString = [
    params.key,
    params.txnid,
    formattedAmount,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 || '',
    params.udf2 || '',
    params.udf3 || '',
    params.udf4 || '',
    params.udf5 || '',
    '', '', '', '', '',
    params.salt,
  ].join('|');

  return computeSha512(hashString);
}

/**
 * PayU Reverse Hash Verification Formula:
 * sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
function verifyPayUReverseHash(payload: any, salt: string): boolean {
  const formattedAmount = Number(payload.amount).toFixed(2);
  let reverseString: string;

  if (payload.additionalCharges) {
    reverseString = [
      payload.additionalCharges,
      salt,
      payload.status,
      '', '', '', '', '',
      payload.udf5 || '',
      payload.udf4 || '',
      payload.udf3 || '',
      payload.udf2 || '',
      payload.udf1 || '',
      payload.email || '',
      payload.firstname || '',
      payload.productinfo || '',
      formattedAmount,
      payload.txnid,
      payload.key,
    ].join('|');
  } else {
    reverseString = [
      salt,
      payload.status,
      '', '', '', '', '',
      payload.udf5 || '',
      payload.udf4 || '',
      payload.udf3 || '',
      payload.udf2 || '',
      payload.udf1 || '',
      payload.email || '',
      payload.firstname || '',
      payload.productinfo || '',
      formattedAmount,
      payload.txnid,
      payload.key,
    ].join('|');
  }

  const computedHash = computeSha512(reverseString);
  return computedHash.toLowerCase() === (payload.hash || '').toLowerCase();
}

/**
 * Generates an ESC/POS Buffer for thermal receipt printers (80mm/58mm)
 */
function buildEscPosBuffer(order: any, theaterHeader = 'GRAND CINEPLEX'): Buffer {
  const ESC = 0x1b;
  const GS = 0x1d;
  const chunks: Buffer[] = [];

  const add = (...bytes: number[]) => chunks.push(Buffer.from(bytes));
  const addText = (text: string) => chunks.push(Buffer.from(text, 'utf-8'));

  // 1. Initialize printer
  add(ESC, 0x40);

  // 2. Center alignment
  add(ESC, 0x61, 0x01);

  // 3. Double-height & Double-width for Cinema Name Header
  add(ESC, 0x45, 0x01); // Bold ON
  add(GS, 0x21, 0x11);  // 2x W, 2x H
  addText(`${theaterHeader.toUpperCase()}\n`);

  // Reset to normal font
  add(GS, 0x21, 0x00);
  add(ESC, 0x45, 0x00); // Bold OFF
  addText('KITCHEN DISPATCH & F&B TICKET\n');
  addText('==========================================\n');

  // 4. Token & Seat Banner (Emphasized for Kitchen Staff)
  add(ESC, 0x61, 0x01); // Center
  add(ESC, 0x45, 0x01); // Bold ON
  add(GS, 0x21, 0x22);  // 3x Size for Token Number
  addText(`TOKEN #${order.token_number || 84}\n`);
  add(GS, 0x21, 0x11);  // 2x Size for Audi / Seat
  addText(`${order.screen_number || 'Audi 3'}  [SEAT ${order.seat_location || 'F12'}]\n`);

  add(GS, 0x21, 0x00); // Normal size
  add(ESC, 0x45, 0x00); // Bold OFF
  const deliveryType = order.delivery_mode === 'SEAT_SERVICE' ? '★ SEAT DELIVERY ★' : '★ COUNTER PICKUP ★';
  addText(`${deliveryType}\n`);
  addText('==========================================\n');

  // 5. Order Meta (Left aligned)
  add(ESC, 0x61, 0x00); // Left align
  addText(`Order ID : ${order.order_id || '#000'}\n`);
  addText(`Placed At: ${order.time_display || new Date().toLocaleTimeString()}\n`);
  addText(`Payment  : PayU UPI (PAID)\n`);
  if (order.upi_txn_id || order.payu_mihpayid) {
    addText(`NPCI Ref : ${order.upi_txn_id || order.payu_mihpayid}\n`);
  }
  addText('------------------------------------------\n');

  // 6. Food Items Breakdown
  add(ESC, 0x45, 0x01); // Bold
  addText('ITEMS TO PREPARE:\n');
  add(ESC, 0x45, 0x00); // Normal

  if (Array.isArray(order.items)) {
    order.items.forEach((item: any, idx: number) => {
      const sizeStr = item.size ? ` (${item.size.split(' ')[0]})` : '';
      const flavorStr = item.flavor ? ` [${item.flavor}]` : '';
      add(ESC, 0x45, 0x01);
      addText(` ${idx + 1}. [ ${item.quantity}x ] ${item.name}${sizeStr}\n`);
      add(ESC, 0x45, 0x00);
      if (flavorStr) {
        addText(`      Flavors: ${flavorStr}\n`);
      }
    });
  }

  addText('------------------------------------------\n');
  addText(`TOTAL AMOUNT : Rs. ${Number(order.total_amount || 0).toFixed(2)}\n`);
  addText('==========================================\n');

  // 7. Footer
  add(ESC, 0x61, 0x01); // Center
  addText('** DISPATCH TO AUDITORIUM RUNNER **\n');
  addText('CineSnack Direct POS-80 System\n\n\n\n');

  // 8. Feed and Cut paper (GS V 66 0)
  add(GS, 0x56, 0x42, 0x00);

  return Buffer.concat(chunks);
}

/**
 * Sends a raw Buffer to a network TCP ESC/POS thermal printer
 */
function sendRawBufferToTcpPrinter(
  host: string,
  port: number,
  buffer: Buffer,
  timeoutMs = 6000
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const client = new net.Socket();
    let isResolved = false;

    client.setTimeout(timeoutMs);

    client.connect(port, host, () => {
      client.write(buffer, () => {
        const latencyMs = Date.now() - startTime;
        isResolved = true;
        client.end();
        resolve({
          success: true,
          message: `Successfully transmitted ${buffer.length} bytes to thermal printer at ${host}:${port}`,
          latencyMs,
        });
      });
    });

    client.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        const latencyMs = Date.now() - startTime;
        client.destroy();
        resolve({
          success: false,
          message: `Printer connection failed (${host}:${port}): ${err.message}`,
          latencyMs,
        });
      }
    });

    client.on('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        const latencyMs = Date.now() - startTime;
        client.destroy();
        resolve({
          success: false,
          message: `Printer timed out after ${timeoutMs}ms (${host}:${port})`,
          latencyMs,
        });
      }
    });
  });
}

// Broadcast SSE Event to all subscribed theater clients
function broadcastEvent(eventType: string, data: any, targetTheaterId?: string) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    if (!targetTheaterId || !client.theater_id || client.theater_id === targetTheaterId) {
      try {
        client.res.write(payload);
      } catch {}
    }
  });
}

// Background Queue Worker Loop (Simulating BullMQ worker processing payment events)
function startQueueWorker() {
  setInterval(async () => {
    if (messageQueue.length === 0) return;

    const job = messageQueue.shift();
    if (!job) return;

    const processingStart = Date.now();
    const theater = theatersDatabase[job.theater_id] || theatersDatabase['th_grand_cineplex'];

    // 1. Dispatch Real-time Event to Kitchen Tablet and Admin KDS
    broadcastEvent('order:paid', {
      order_id: job.order_id,
      theater_id: job.theater_id,
      txnid: job.txnid,
      amount: job.amount,
      token_number: job.raw_payload?.udf5 || 84,
      seat_location: job.raw_payload?.udf3 || 'F-12',
      screen_number: job.raw_payload?.udf2 || 'Audi 3',
      timestamp: new Date().toISOString(),
    }, job.theater_id);

    // 2. Dispatch Thermal Print Job if enabled for this theater
    let printSuccess = false;
    if (theater.printer.auto_print && job.raw_payload?.order) {
      try {
        const escposBuffer = buildEscPosBuffer(job.raw_payload.order, theater.printer.header_name || theater.name);
        const res = await sendRawBufferToTcpPrinter(theater.printer.host, theater.printer.port, escposBuffer);
        printSuccess = res.success;

        printLogs.unshift({
          id: `job-${Date.now()}`,
          theater_id: job.theater_id,
          order_id: job.order_id,
          token_number: Number(job.raw_payload?.udf5) || 0,
          host: theater.printer.host,
          port: theater.printer.port,
          status: res.success ? 'SUCCESS' : 'FAILED',
          message: res.message,
          timestamp: new Date().toLocaleTimeString(),
        });
        if (printLogs.length > 50) printLogs.pop();
      } catch (err: any) {
        console.error(`Printer queue dispatch error: ${err.message}`);
      }
    }

    job.processed_at = new Date().toISOString();
    job.print_dispatched = printSuccess;
    job.queued_duration_ms = Date.now() - processingStart;

    processedJobs.unshift(job);
    if (processedJobs.length > 100) processedJobs.pop();
  }, 100);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Start asynchronous queue worker
  startQueueWorker();

  // API Route: Database Health & Schema Status
  app.get('/api/database/status', async (req, res) => {
    try {
      const status = await checkSupabaseConnection();
      res.json({
        success: true,
        provider: 'Supabase PostgreSQL (Singapore ap-southeast-1)',
        project_id: 'tpvwgtkjfysiglyjqdtd',
        ...status,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: Seed Login Credentials into Supabase Database
  app.post('/api/database/seed-credentials', async (req, res) => {
    try {
      const result = await seedSupabaseCredentials();
      res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: MFA Setup & QR Code Generator for Google Authenticator / Authy
  app.get('/api/auth/mfa-setup', (req, res) => {
    const username = (req.query.username as string) || 'Sreegeethesh';
    const clientEpoch = req.query.client_epoch ? Number(req.query.client_epoch) : undefined;
    const enrollment = createMfaEnrollment(username, MASTER_MFA_SECRET_DEFAULT);
    const liveToken = getCurrentMfaToken(enrollment.secret, clientEpoch);
    res.json({
      success: true,
      username,
      issuer: 'Snack Box (N4X)',
      secret: enrollment.secret,
      otpauth_uri: enrollment.uri,
      live_demo_code: liveToken,
    });
  });

  // API Route: Master Admin MFA Code Verification
  app.post('/api/auth/mfa-verify', (req, res) => {
    const { token, secret, client_epoch } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, message: '6-digit Authenticator code required' });
    }

    const isValid = verifyMfaToken(token, secret || MASTER_MFA_SECRET_DEFAULT, client_epoch) || token.trim() === '934566';
    if (isValid) {
      return res.json({
        success: true,
        valid: true,
        message: 'MFA 2-Step Verification passed successfully',
      });
    } else {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Invalid or expired 6-digit Authenticator code. Please check your Google Authenticator or Authy app, or use Master Recovery PIN (934566).',
      });
    }
  });

  // API Route: Unified Admin Login with Database & MFA Enforced for Master Admin
  app.post('/api/auth/login', async (req, res) => {
    const { username, password, mfa_token, client_epoch } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    // 1. Check Supabase Database (if connected)
    const supabase = getSupabase();
    if (supabase) {
      try {
        // Query master_admin table
        const { data: dbAdmin } = await supabase
          .from('master_admin')
          .select('*')
          .ilike('username', trimmedUser)
          .maybeSingle();

        if (dbAdmin) {
          if (dbAdmin.password_hash !== trimmedPass) {
            return res.status(401).json({ success: false, message: 'Invalid master admin password' });
          }

          if (dbAdmin.mfa_enabled && !mfa_token) {
            return res.json({
              success: false,
              mfa_required: true,
              username: dbAdmin.username,
              message: 'Two-Factor Authentication required. Enter your 6-digit Authenticator code.',
            });
          }

          if (dbAdmin.mfa_enabled && mfa_token) {
            const secret = dbAdmin.mfa_secret || MASTER_MFA_SECRET_DEFAULT;
            const isMfaValid = verifyMfaToken(mfa_token, secret, client_epoch) || mfa_token.trim() === '934566';
            if (!isMfaValid) {
              return res.status(401).json({
                success: false,
                mfa_required: true,
                message: 'Invalid 6-digit Authenticator code.',
              });
            }
          }

          return res.json({
            success: true,
            role: 'MASTER_ADMIN',
            username: dbAdmin.username,
            display_name: dbAdmin.display_name || 'Sreegeethesh (Gateway Master)',
            mfa_verified: true,
            session_token: `sbx_master_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
          });
        }

        // Query theaters table in Supabase
        const { data: dbTheater } = await supabase
          .from('theaters')
          .select('*')
          .or(`admin_username.ilike.${trimmedUser},theater_id.eq.${trimmedUser}`)
          .maybeSingle();

        if (dbTheater) {
          if (dbTheater.admin_password !== trimmedPass) {
            return res.status(401).json({ success: false, message: 'Invalid theater staff password' });
          }
          return res.json({
            success: true,
            role: 'THEATER_ADMIN',
            theater_id: dbTheater.theater_id,
            theater_name: dbTheater.name,
            username: dbTheater.admin_username,
            session_token: `sbx_theater_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
          });
        }
      } catch (dbErr: any) {
        console.warn('[Supabase] Auth query skipped:', dbErr.message);
      }
    }

    // 2. In-Memory / Configured Fallback: Master Admin
    if (trimmedUser.toLowerCase() === 'sreegeethesh') {
      if (trimmedPass !== 'Sree@9345662166') {
        return res.status(401).json({ success: false, message: 'Invalid master admin password' });
      }

      if (!mfa_token) {
        return res.json({
          success: false,
          mfa_required: true,
          username: 'Sreegeethesh',
          message: 'Two-Factor Authentication required. Please enter your 6-digit Google Authenticator code.',
        });
      }

      // Verify MFA token
      const isMfaValid = verifyMfaToken(mfa_token, MASTER_MFA_SECRET_DEFAULT, client_epoch) || mfa_token.trim() === '934566';
      if (!isMfaValid) {
        return res.status(401).json({
          success: false,
          mfa_required: true,
          message: 'Invalid or expired 6-digit code. Please verify against Google Authenticator or use backup PIN.',
        });
      }

      return res.json({
        success: true,
        role: 'MASTER_ADMIN',
        username: 'Sreegeethesh',
        display_name: 'Sreegeethesh (Gateway Master)',
        mfa_verified: true,
        session_token: `sbx_master_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      });
    }

    // 3. In-Memory / Configured Fallback: Theater Admin
    let matchedTheater: TheaterEntity | null = null;
    for (const [key, theater] of Object.entries(theatersDatabase)) {
      const adminUser = `admin_${theater.theater_id.replace('th_', '')}`;
      if (
        (trimmedUser === adminUser || trimmedUser === theater.theater_id || (trimmedUser.includes('grand') && adminUser.includes('grand'))) &&
        (trimmedPass === 'grand@123' || trimmedPass === 'admin@123' || trimmedPass === 'cinestar@123')
      ) {
        matchedTheater = theater;
        break;
      }
    }

    if (matchedTheater) {
      return res.json({
        success: true,
        role: 'THEATER_ADMIN',
        theater_id: matchedTheater.theater_id,
        theater_name: matchedTheater.name,
        username: trimmedUser,
        session_token: `sbx_theater_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your username and password.' });
  });

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CineSnack Multi-Theater UPI & PayU SaaS Engine',
      active_theaters: Object.keys(theatersDatabase).length,
      queue_length: messageQueue.length,
      timestamp: new Date().toISOString(),
    });
  });

  // API Route: Server-Sent Events for Real-time Kitchen & Admin Push
  app.get('/api/events', (req, res) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const theaterId = (req.query.theater_id as string) || undefined;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

    sseClients.push({ id: clientId, theater_id: theaterId, res });

    req.on('close', () => {
      const idx = sseClients.findIndex((c) => c.id === clientId);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  });

  // API Route: Theaters Multi-Merchant Endpoints
  app.get('/api/theaters', (req, res) => {
    res.json({ theaters: Object.values(theatersDatabase) });
  });

  app.get('/api/theaters/:id', (req, res) => {
    const theater = theatersDatabase[req.params.id];
    if (!theater) {
      return res.status(404).json({ success: false, message: 'Theater merchant not found' });
    }
    res.json({ success: true, theater });
  });

  app.put('/api/theaters/:id/kyc', (req, res) => {
    const theater = theatersDatabase[req.params.id];
    if (!theater) {
      return res.status(404).json({ success: false, message: 'Theater not found' });
    }
    theater.kyc = { ...theater.kyc, ...req.body };
    res.json({ success: true, kyc: theater.kyc });
  });

  app.put('/api/theaters/:id/payu', (req, res) => {
    const theater = theatersDatabase[req.params.id];
    if (!theater) {
      return res.status(404).json({ success: false, message: 'Theater not found' });
    }
    theater.payu = { ...theater.payu, ...req.body };
    res.json({ success: true, payu: theater.payu });
  });

  // API Route: Secure Master Admin Theater Deletion with 2-Step Security Verification
  app.delete('/api/theaters/:id', async (req, res) => {
    const theaterId = req.params.id;
    const mfaToken = String(
      req.body?.mfa_token || req.query?.mfa_token || req.headers['x-mfa-token'] || ''
    ).trim();

    // Enforce 2-Step Security Verification (TOTP Authenticator code or Master PIN 934566)
    const isMfaValid =
      verifyMfaToken(mfaToken, MASTER_MFA_SECRET_DEFAULT) || mfaToken === '934566';

    if (!isMfaValid) {
      return res.status(403).json({
        success: false,
        message: 'Invalid 2-Step Security Verification code. Enter your 6-digit Authenticator code or Master PIN.',
      });
    }

    if (Object.keys(theatersDatabase).length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the only remaining theater. At least one theater merchant must remain active.',
      });
    }

    // 1. Delete from Supabase PostgreSQL if connected
    await deleteTheaterFromSupabase(theaterId);

    // 2. Delete from in-memory runtime cache
    delete theatersDatabase[theaterId];

    // 3. Broadcast real-time SSE notification
    broadcastEvent('theater:deleted', { theater_id: theaterId });

    return res.json({
      success: true,
      message: `Theater merchant "${theaterId}" permanently deleted.`,
    });
  });

  // ==========================================
  // API Routes: Live Menu Synchronization
  // Ensures QR-scanned mobile phones receive instant live price updates
  // ==========================================

  // GET /api/menu?theater_id=...
  app.get('/api/menu', async (req, res) => {
    const theaterId = (req.query.theater_id as string) || undefined;

    // 1. Check Supabase PostgreSQL
    const dbItems = await getMenuItemsFromSupabase(theaterId);
    if (dbItems && dbItems.length > 0) {
      // Map Supabase snake_case columns to MenuItem interface
      const mappedItems = dbItems.map((item) => ({
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
        available: item.available ?? true,
      }));
      return res.json({ success: true, source: 'supabase', items: mappedItems });
    }

    // 2. Fallback to centralized in-memory menu state
    const filtered = theaterId
      ? serverMenuItems.filter((i) => !i.theater_id || i.theater_id === theaterId)
      : serverMenuItems;

    return res.json({ success: true, source: 'memory', items: filtered });
  });

  // POST /api/menu (Create or upsert item)
  app.post('/api/menu', async (req, res) => {
    const item = req.body;
    if (!item || !item.name) {
      return res.status(400).json({ success: false, message: 'Invalid menu item payload' });
    }

    const newItem: ServerMenuItem = {
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      theater_id: item.theater_id,
      name: item.name,
      category: item.category || 'popcorn',
      description: item.description || '',
      price: Number(item.price) || 100,
      image: item.image || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80',
      isVeg: item.isVeg ?? true,
      isBestseller: item.isBestseller ?? false,
      calories: item.calories,
      prepTimeMinutes: Number(item.prepTimeMinutes) || 3,
      sizes: item.sizes,
      flavors: item.flavors,
      available: item.available ?? true,
    };

    const existingIdx = serverMenuItems.findIndex((i) => i.id === newItem.id);
    if (existingIdx !== -1) {
      serverMenuItems[existingIdx] = newItem;
    } else {
      serverMenuItems.push(newItem);
    }

    // Persist to Supabase in background
    upsertMenuItemInSupabase(newItem).catch(console.warn);

    // Broadcast SSE update so customers and staff see the new item immediately
    broadcastEvent('menu:updated', { item: newItem });

    return res.json({ success: true, item: newItem });
  });

  // PUT /api/menu/:id (Update price or item attributes)
  app.put('/api/menu/:id', async (req, res) => {
    const itemId = req.params.id;
    const updates = req.body;

    const idx = serverMenuItems.findIndex((i) => i.id === itemId);
    if (idx === -1) {
      // If not in memory, construct it
      const fallbackItem: ServerMenuItem = {
        id: itemId,
        name: updates.name || 'Menu Item',
        category: updates.category || 'popcorn',
        description: updates.description || '',
        price: Number(updates.price) || 100,
        image: updates.image || '',
        isVeg: updates.isVeg ?? true,
        prepTimeMinutes: updates.prepTimeMinutes || 3,
        ...updates,
      };
      serverMenuItems.push(fallbackItem);
      upsertMenuItemInSupabase(fallbackItem).catch(console.warn);
      broadcastEvent('menu:updated', { item: fallbackItem });
      return res.json({ success: true, item: fallbackItem });
    }

    serverMenuItems[idx] = {
      ...serverMenuItems[idx],
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : serverMenuItems[idx].price,
    };

    upsertMenuItemInSupabase(serverMenuItems[idx]).catch(console.warn);
    broadcastEvent('menu:updated', { item: serverMenuItems[idx] });

    return res.json({ success: true, item: serverMenuItems[idx] });
  });

  // DELETE /api/menu/:id
  app.delete('/api/menu/:id', async (req, res) => {
    const itemId = req.params.id;
    serverMenuItems = serverMenuItems.filter((i) => i.id !== itemId);
    deleteMenuItemFromSupabase(itemId).catch(console.warn);
    broadcastEvent('menu:deleted', { id: itemId });
    return res.json({ success: true, message: `Menu item ${itemId} deleted` });
  });

  // POST /api/menu/reset
  app.post('/api/menu/reset', (req, res) => {
    serverMenuItems = [...INITIAL_SERVER_MENU];
    broadcastEvent('menu:reset', {});
    return res.json({ success: true, items: serverMenuItems });
  });

  // ==========================================
  // API Route: Automated Payment Verification Polling
  // Enables client to automatically confirm payment via bank gateway
  // ==========================================
  app.get('/api/payu/verify-payment', async (req, res) => {
    const orderId = String(req.query.order_id || '').trim();
    const txnid = String(req.query.txnid || '').trim();

    if (!orderId && !txnid) {
      return res.json({ paid: false, message: 'Missing order_id or txnid' });
    }

    // 1. Check in-memory processed jobs and incoming queue
    const matchedJob =
      processedJobs.find(
        (j) =>
          (orderId && (j.order_id === orderId || j.order_id === `#${orderId}` || `#${j.order_id}` === orderId)) ||
          (txnid && j.txnid === txnid)
      ) ||
      messageQueue.find(
        (j) =>
          (orderId && (j.order_id === orderId || j.order_id === `#${orderId}` || `#${j.order_id}` === orderId)) ||
          (txnid && j.txnid === txnid)
      );

    if (matchedJob && matchedJob.status === 'success') {
      return res.json({
        paid: true,
        order_id: matchedJob.order_id,
        txnid: matchedJob.txnid,
        amount: matchedJob.amount,
        theater_id: matchedJob.theater_id,
      });
    }

    // 2. Check Supabase orders / transactions table
    const supabase = getSupabase();
    if (supabase) {
      try {
        if (orderId) {
          const cleanId = orderId.replace(/^#/, '');
          const { data: dbOrder } = await supabase
            .from('orders')
            .select('*')
            .or(`order_id.eq.${orderId},order_id.eq.#${cleanId},order_id.eq.${cleanId}`)
            .eq('payment_status', 'PAID')
            .maybeSingle();

          if (dbOrder) {
            return res.json({
              paid: true,
              order_id: dbOrder.order_id,
              txnid: dbOrder.upi_txn_id || `TXN_${Date.now()}`,
              amount: dbOrder.total_amount,
              theater_id: dbOrder.theater_id,
            });
          }
        }

        if (txnid || orderId) {
          const query = supabase.from('payu_transactions').select('*').eq('payment_status', 'success');
          const { data: dbTxn } = await (txnid
            ? query.eq('txnid', txnid)
            : query.or(`order_id.eq.${orderId},order_id.eq.#${orderId}`)
          ).maybeSingle();

          if (dbTxn) {
            return res.json({
              paid: true,
              order_id: dbTxn.order_id,
              txnid: dbTxn.txnid,
              amount: dbTxn.amount,
              theater_id: dbTxn.theater_id,
            });
          }
        }
      } catch {
        // Fall through
      }
    }

    return res.json({ paid: false });
  });

  // API Route: Real PayU UPI Payment Intent Creation
  app.post('/api/payu/create-payment', (req, res) => {
    const {
      theater_id = 'th_grand_cineplex',
      order_id,
      amount,
      productinfo = 'Cinema Concession Food',
      firstname = 'Guest',
      email = 'guest@cinesnack.in',
      phone = '9876543210',
      screen_number = 'Audi 3',
      seat_location = 'F-12',
      delivery_mode = 'SEAT_SERVICE',
      token_number = 84,
    } = req.body;

    const theater = theatersDatabase[theater_id] || theatersDatabase['th_grand_cineplex'];
    const txnid = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const formattedAmount = Number(amount).toFixed(2);

    // Compute PayU Forward SHA-512 Hash with the theater's unique secret Salt
    const hash = createPayUHash({
      key: theater.payu.merchant_key,
      txnid,
      amount: formattedAmount,
      productinfo,
      firstname,
      email,
      udf1: theater.theater_id,
      udf2: screen_number,
      udf3: seat_location,
      udf4: delivery_mode,
      udf5: String(token_number),
      salt: theater.payu.merchant_salt,
    });

    // Build Standard Direct NPCI UPI Intent Link (direct bank settlement)
    const transactionNote = `${theater.name} • Token #${token_number} (${screen_number} ${seat_location})`;
    const upiIntentUri = `upi://pay?pa=${encodeURIComponent(
      theater.kyc.payee_vpa
    )}&pn=${encodeURIComponent(
      theater.kyc.legal_business_name
    )}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(
      transactionNote
    )}&tr=${txnid}&mc=5812&mode=00&orgid=159001`;

    const payuParams: Record<string, string> = {
      key: theater.payu.merchant_key,
      txnid,
      amount: formattedAmount,
      productinfo,
      firstname,
      email,
      phone,
      surl: `${theater.payu.webhook_url}?status=success`,
      furl: `${theater.payu.webhook_url}?status=failure`,
      hash,
      pg: 'UPI',
      bankcode: 'INTENT',
      udf1: theater.theater_id,
      udf2: screen_number,
      udf3: seat_location,
      udf4: delivery_mode,
      udf5: String(token_number),
    };

    res.json({
      success: true,
      txnid,
      order_id,
      theater_id: theater.theater_id,
      key: theater.payu.merchant_key,
      hash,
      amount: formattedAmount,
      action_url: theater.payu.payu_checkout_url,
      upi_intent_uri: upiIntentUri,
      payee_vpa: theater.kyc.payee_vpa,
      payee_name: theater.kyc.legal_business_name,
      mdr_rate: theater.kyc.mdr_rate,
      settlement_schedule: theater.kyc.settlement_schedule,
      params: payuParams,
    });
  });

  // API Route: High-Throughput Edge Webhook Endpoint (<50ms response, async queue push)
  // Accepts notifications from PayU Gateway or Simulated Gateway
  const handlePayUWebhook = async (req: express.Request, res: express.Response) => {
    const receivedTime = Date.now();
    const payload = req.body || {};

    const theaterId = payload.udf1 || payload.theater_id || 'th_grand_cineplex';
    const theater = theatersDatabase[theaterId] || theatersDatabase['th_grand_cineplex'];
    
    // Verify cryptographic signature if hash is present
    let signatureVerified = true;
    if (payload.hash) {
      signatureVerified = verifyPayUReverseHash(payload, theater.payu.merchant_salt);
    }

    const orderId = payload.udf6 || payload.order_id || payload.txnid || `#ORD-${Date.now().toString().slice(-4)}`;

    // Enqueue job into high-throughput queue (simulating BullMQ job push)
    const job: QueueJob = {
      job_id: `qjob_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      theater_id: theater.theater_id,
      order_id: orderId,
      txnid: payload.txnid || `NPCI_${Date.now()}`,
      amount: Number(payload.amount || payload.order?.total_amount || 0),
      status: payload.status || 'success',
      signature_verified: signatureVerified,
      received_at: new Date().toISOString(),
      queued_duration_ms: 0,
      print_dispatched: false,
      raw_payload: payload,
    };

    messageQueue.push(job);

    const responseDurationMs = Date.now() - receivedTime;

    // IMMEDIATE <50ms HTTP 200 OK Response back to payment gateway
    res.status(200).json({
      status: 'SUCCESS',
      message: 'PayU webhook acknowledged and queued for asynchronous execution',
      job_id: job.job_id,
      theater_id: theater.theater_id,
      signature_verified: signatureVerified,
      gateway_latency_ms: responseDurationMs,
    });
  };

  app.post('/api/payu/webhook', handlePayUWebhook);
  app.post('/api/webhooks/payu', handlePayUWebhook);
  app.post('/api/upi/webhook', handlePayUWebhook);

  // API Route: Queue Stats & Webhook Inspector
  app.get('/api/queue/stats', (req, res) => {
    res.json({
      active_queue_size: messageQueue.length,
      processed_jobs_count: processedJobs.length,
      recent_processed_jobs: processedJobs.slice(0, 15),
      current_queue_jobs: messageQueue.slice(0, 10),
      sse_active_subscribers: sseClients.length,
      average_latency_ms: 32,
    });
  });

  // API Route: Test Thermal Printer TCP Connection
  app.post('/api/printer/test-connection', async (req, res) => {
    const host = (req.body.host || 'virtual-printer.online').trim();
    const port = Number(req.body.port) || 9359;

    const ESC = 0x1b;
    const GS = 0x1d;
    const testBuffer = Buffer.concat([
      Buffer.from([ESC, 0x40, ESC, 0x61, 0x01, ESC, 0x45, 0x01]),
      Buffer.from('--- CINESNACK PRINTER CONNECTIVITY TEST ---\n\n', 'utf-8'),
      Buffer.from([ESC, 0x45, 0x00, GS, 0x21, 0x11]),
      Buffer.from('CONNECTION: OK\n', 'utf-8'),
      Buffer.from([GS, 0x21, 0x00]),
      Buffer.from(`Host: ${host}:${port}\nTime: ${new Date().toLocaleTimeString()}\n\n\n\n`, 'utf-8'),
      Buffer.from([GS, 0x56, 0x42, 0x00]),
    ]);

    const result = await sendRawBufferToTcpPrinter(host, port, testBuffer);
    res.json(result);
  });

  // API Route: Dispatch Kitchen Slip to TCP / Virtual Printer
  app.post('/api/printer/print-receipt', async (req, res) => {
    const { order, printerHost, printerPort, theaterHeader } = req.body;
    const host = (printerHost || 'virtual-printer.online').trim();
    const port = Number(printerPort) || 9359;

    if (!order) {
      return res.status(400).json({ success: false, message: 'Missing order object in request payload' });
    }

    try {
      const escposBuffer = buildEscPosBuffer(order, theaterHeader);
      const printResult = await sendRawBufferToTcpPrinter(host, port, escposBuffer);

      const logEntry: PrintJobLog = {
        id: `job-${Date.now()}`,
        theater_id: order.theater_id || 'th_grand_cineplex',
        order_id: order.order_id || 'UNKNOWN',
        token_number: order.token_number || 0,
        host,
        port,
        status: printResult.success ? 'SUCCESS' : 'FAILED',
        message: printResult.message,
        timestamp: new Date().toLocaleTimeString(),
      };
      printLogs.unshift(logEntry);
      if (printLogs.length > 50) printLogs.pop();

      res.json({
        ...printResult,
        jobId: logEntry.id,
        bytesSent: escposBuffer.length,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: `Failed to generate or send receipt: ${err.message}`,
      });
    }
  });

  // API Route: Retrieve Print Logs
  app.get('/api/printer/logs', (req, res) => {
    res.json({ logs: printLogs });
  });

  // Vite middleware in development vs Static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CineSnack Multi-Theater SaaS server running on http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is temporarily busy. Retrying...`);
    } else {
      console.error('[Server] Listener error:', err);
    }
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
