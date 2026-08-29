import express from 'express';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory printer job log for admin inspection
interface PrintJobLog {
  id: string;
  order_id: string;
  token_number: number;
  host: string;
  port: number;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  timestamp: string;
}

const printLogs: PrintJobLog[] = [];

/**
 * Generates an ESC/POS Buffer for thermal receipt printers (80mm/58mm)
 */
function buildEscPosBuffer(order: any): Buffer {
  const ESC = 0x1b;
  const GS = 0x1d;

  const chunks: Buffer[] = [];

  // Helper to add byte commands
  const add = (...bytes: number[]) => chunks.push(Buffer.from(bytes));
  const addText = (text: string) => chunks.push(Buffer.from(text, 'utf-8'));

  // 1. Initialize printer
  add(ESC, 0x40);

  // 2. Center alignment
  add(ESC, 0x61, 0x01);

  // 3. Double-height & Double-width for Cinema Name Header
  add(ESC, 0x45, 0x01); // Bold ON
  add(GS, 0x21, 0x11);  // 2x W, 2x H
  addText('GRAND CINEPLEX\n');

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
  addText(`Payment  : 0% MDR UPI (PAID)\n`);
  if (order.upi_txn_id) {
    addText(`NPCI Ref : ${order.upi_txn_id}\n`);
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
 * Sends a raw Buffer to a network TCP ESC/POS thermal printer (e.g. virtual-printer.online:9359)
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
      // Socket connected, send ESC/POS payload
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory backend orders array for server-side endpoints
  const serverOrders: Array<{
    order_id: string;
    token_number: number;
    screen_number: string;
    seat_location: string;
    delivery_mode: string;
    payment_status: string;
    order_timestamp: string;
    total_amount: number;
    items: Array<{ name: string; quantity: number; price: number }>;
  }> = [];

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CineSnack 0% MDR UPI & Kitchen Dispatch Engine',
      timestamp: new Date().toISOString(),
    });
  });

  // API Route: Test Thermal Printer TCP Connection
  app.post('/api/printer/test-connection', async (req, res) => {
    const host = (req.body.host || 'virtual-printer.online').trim();
    const port = Number(req.body.port) || 9359;

    // Send a brief ESC/POS initialization & test slip
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
    const { order, printerHost, printerPort } = req.body;
    const host = (printerHost || 'virtual-printer.online').trim();
    const port = Number(printerPort) || 9359;

    if (!order) {
      return res.status(400).json({ success: false, message: 'Missing order object in request payload' });
    }

    try {
      const escposBuffer = buildEscPosBuffer(order);
      const printResult = await sendRawBufferToTcpPrinter(host, port, escposBuffer);

      // Record to print log
      const logEntry: PrintJobLog = {
        id: `job-${Date.now()}`,
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

  // API Route: Generate strict 0% MDR UPI Intent String
  app.post('/api/upi/create-intent', (req, res) => {
    const { order_id, amount, screen_number, seat_location, token_number } = req.body;
    const payee_vpa = 'grandcineplex.snacks@icici';
    const payee_name = 'Grand Cineplex F&B Ltd';

    const upiUri = `upi://pay?pa=${payee_vpa}&pn=${encodeURIComponent(
      payee_name
    )}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(
      `Cinema Token #${token_number || 84} - ${screen_number} ${seat_location}`
    )}&tr=TXN${order_id?.replace('#', '') || Date.now()}&mode=00&orgid=159001`;

    res.json({
      success: true,
      order_id,
      upi_intent_uri: upiUri,
      mdr_rate: '0.00%',
      settlement_channel: 'NPCI Direct Bank Rail',
      disabled_instruments: ['credit_card', 'prepaid_wallet'],
    });
  });

  // API Route: Secure Payment Gateway Webhook Receiver
  app.post('/api/upi/webhook', async (req, res) => {
    const { order, order_id, upi_txn_id, amount, status } = req.body;
    console.log(`[UPI Webhook] Received status "${status}" for Order ${order_id || order?.order_id}, Txn: ${upi_txn_id}`);

    // Update in-memory order status
    const targetOrderId = order_id || order?.order_id;
    const existingOrder = serverOrders.find((o) => o.order_id === targetOrderId);
    if (existingOrder) {
      existingOrder.payment_status = 'PAID';
    }

    let printResult = null;
    if (order) {
      try {
        const escposBuffer = buildEscPosBuffer(order);
        printResult = await sendRawBufferToTcpPrinter('virtual-printer.online', 9359, escposBuffer);
      } catch (err: any) {
        console.error(`Automatic print failed: ${err.message}`);
      }
    }

    res.json({
      received: true,
      order_id: targetOrderId,
      status: 'PAID',
      thermal_printer_dispatched: printResult?.success || false,
      timestamp: new Date().toISOString(),
    });
  });

  // API Route: Fetch Orders
  app.get('/api/orders', (req, res) => {
    res.json({ orders: serverOrders });
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
    console.log(`🎬 CineSnack server running on http://localhost:${PORT}`);
  });
}

startServer();

