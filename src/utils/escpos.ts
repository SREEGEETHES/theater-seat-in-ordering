import { Order } from '../types';

/**
 * ESC/POS Thermal Receipt Layout Formatter
 * Generates both formatted text and ESC/POS command byte streams for thermal network printers
 */

export function generateThermalReceiptText(order: Order): string {
  const lineSeparator = '='.repeat(40);
  const subSeparator = '-'.repeat(40);

  const screenFormatted = (order.screen_number || 'Screen 01').padEnd(16, ' ');
  const seatFormatted = (order.seat_location || 'General').padEnd(14, ' ');

  const timeFormatted = order.time_display || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const orderIdPadded = (order.order_id || '#00000').padEnd(18, ' ');

  const deliveryTypeText = order.delivery_mode === 'SEAT_SERVICE' ? 'SERVE TO SEAT' : 'COUNTER PICKUP';

  const itemsList = order.items
    .map(item => {
      const sizeStr = item.size ? ` (${item.size.split(' ')[0]})` : '';
      const flavorStr = item.flavor ? ` - ${item.flavor}` : '';
      return `- ${item.quantity}x ${item.name}${sizeStr}${flavorStr}`;
    })
    .join('\n');

  return `${lineSeparator}
         THEATER SNACKS RECEIPT         
${lineSeparator}
Order ID: ${orderIdPadded}Time: ${timeFormatted}
${subSeparator}
SCREEN: ${screenFormatted.trim()}          SEAT: ${seatFormatted.trim()}
${subSeparator}
DELIVERY TYPE: ${deliveryTypeText}

ITEMS:
${itemsList}
${subSeparator}
TOKEN NUMBER: ${order.token_number}
CUSTOMER NAME: ${order.customer_name || 'Valued Guest'}
${order.customer_phone ? `PHONE: +91 ${order.customer_phone}\n` : ''}TOTAL AMOUNT: Rs. ${order.total_amount.toFixed(2)}
${lineSeparator}
               PAID via UPI             
${lineSeparator}
       Enjoy Your Movie Experience!     
\n\n\n`;
}

/**
 * Generates raw ESC/POS binary buffer bytes for thermal printers
 */
export function generateEscPosBytes(order: Order): Uint8Array {
  const ESC = 0x1b;
  const GS = 0x1d;

  const commands: number[] = [];

  // Initialize printer: ESC @
  commands.push(ESC, 0x40);

  // Center align: ESC a 1
  commands.push(ESC, 0x61, 0x01);

  // Bold on: ESC E 1
  commands.push(ESC, 0x45, 0x01);
  // Double height & width for header
  commands.push(GS, 0x21, 0x11);

  // Header
  const headerText = "THEATER SNACKS\n";
  for (let i = 0; i < headerText.length; i++) {
    commands.push(headerText.charCodeAt(i));
  }

  // Normal text size
  commands.push(GS, 0x21, 0x00);
  commands.push(ESC, 0x45, 0x00); // Bold off

  // Left align: ESC a 0
  commands.push(ESC, 0x61, 0x00);

  const receiptContent = generateThermalReceiptText(order);
  for (let i = 0; i < receiptContent.length; i++) {
    commands.push(receiptContent.charCodeAt(i));
  }

  // Feed and cut paper: GS V 66 0
  commands.push(GS, 0x56, 0x42, 0x00);

  return new Uint8Array(commands);
}

/**
 * Triggers standard browser print styled specifically for 80mm/58mm thermal rolls
 */
export function printThermalReceiptInBrowser(order: Order) {
  const receiptText = generateThermalReceiptText(order);
  const printWindow = window.open('', '_blank', 'width=380,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt ${order.order_id}</title>
        <style>
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.3;
            margin: 8px;
            padding: 4px;
            color: #000;
            background: #fff;
            white-space: pre-wrap;
          }
          .bold { font-weight: bold; }
          .center { text-align: center; }
          .token-box {
            border: 2px dashed #000;
            padding: 8px;
            margin: 8px 0;
            text-align: center;
            font-size: 16px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="token-box">
          SCREEN: ${order.screen_number} | SEAT: ${order.seat_location}<br/>
          TOKEN: #${order.token_number}
        </div>
        <pre>${receiptText}</pre>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
