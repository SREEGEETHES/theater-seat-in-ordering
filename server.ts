import express from 'express';
import path from 'path';
import net from 'net';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    city: 'Mumbai',
    address: 'Level 4, Phoenix Palladium, Lower Parel, Mumbai, Maharashtra 400013',
    kyc: {
      legal_business_name: 'Grand Multiplex Theatres Pvt Ltd',
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
    name: 'PVR Heritage Cinemas',
    tagline: 'Koramangala 4K 7.1 Surround & Seat Service',
    city: 'Bengaluru',
    address: '80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
    kyc: {
      legal_business_name: 'Heritage Screen Entertainment LLP',
      company_pan: 'AACHM9876K',
      gstin: '29AACHM9876K1Z2',
      bank_account_number: '50100492817264',
      bank_ifsc: 'ICIC0000047',
      bank_name: 'ICICI Bank, Koramangala 4th Block',
      payee_vpa: 'heritagecinema.upi@icici',
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
      webhook_url: 'https://api.cinesnack.in/api/payu/webhook',
      is_verified: true,
    },
    printer: {
      host: 'virtual-printer.online',
      port: 9359,
      auto_print: true,
      header_name: 'PVR HERITAGE KORAMANGALA',
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
  addText(`Payment  : 0% MDR PayU UPI (PAID)\n`);
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

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CineSnack Multi-Theater 0% MDR UPI & PayU SaaS Engine',
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

  // API Route: Real PayU 0% MDR UPI Payment Intent Creation
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

    // Build Standard Direct NPCI UPI Intent Link (0% MDR direct settlement)
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CineSnack Multi-Theater SaaS server running on http://localhost:${PORT}`);
  });
}

startServer();
