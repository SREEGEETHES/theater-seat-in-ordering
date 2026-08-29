import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  ShieldCheck, 
  FileText, 
  Zap, 
  Send,
  Sliders,
  ExternalLink,
  History,
  Terminal
} from 'lucide-react';
import { printerStore, PrinterConfig, DEFAULT_PRINTER_CONFIG } from '../../utils/printerStore';
import { Order } from '../../types';

interface PrinterSettingsProps {
  latestOrder?: Order | null;
}

export const PrinterSettings: React.FC<PrinterSettingsProps> = ({ latestOrder }) => {
  const [config, setConfig] = useState<PrinterConfig>(printerStore.getConfig());
  const [hostInput, setHostInput] = useState<string>(config.host);
  const [portInput, setPortInput] = useState<number>(config.port);
  const [tokenInput, setTokenInput] = useState<string>(config.workspaceToken || 'epic-wolf-2904');
  const [autoPrint, setAutoPrint] = useState<boolean>(config.autoPrintOnPayment);
  
  const [testingStatus, setTestingStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [testMessage, setTestMessage] = useState<string>('');
  const [logs, setLogs] = useState<any[]>([]);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync state with printer store
  useEffect(() => {
    const unsub = printerStore.subscribe(() => {
      const current = printerStore.getConfig();
      setConfig(current);
      setHostInput(current.host);
      setPortInput(current.port);
      setTokenInput(current.workspaceToken || '');
      setAutoPrint(current.autoPrintOnPayment);
    });

    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/printer/logs');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveConfig = () => {
    printerStore.updateConfig({
      host: hostInput.trim(),
      port: Number(portInput),
      workspaceToken: tokenInput.trim(),
      autoPrintOnPayment: autoPrint,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    printerStore.resetToDefault();
    const reset = DEFAULT_PRINTER_CONFIG;
    setHostInput(reset.host);
    setPortInput(reset.port);
    setTokenInput(reset.workspaceToken || 'epic-wolf-2904');
    setAutoPrint(reset.autoPrintOnPayment);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestingStatus('TESTING');
    setTestMessage('Opening TCP socket to ' + hostInput + ':' + portInput + '...');

    const res = await printerStore.testPrinterConnection(hostInput.trim(), Number(portInput));
    if (res.success) {
      setTestingStatus('SUCCESS');
      setTestMessage(`Online! Test ESC/POS slip sent successfully. (${res.latencyMs || 25}ms)`);
      fetchLogs();
    } else {
      setTestingStatus('ERROR');
      setTestMessage(`Connection Error: ${res.message}`);
    }
  };

  const handleSendSampleSlip = async () => {
    const sampleOrder: Order = latestOrder || {
      order_id: '#ORD-8821',
      token_number: 94,
      screen_number: 'Audi 3 (Dolby Atmos)',
      seat_location: 'F12',
      delivery_mode: 'SEAT_SERVICE',
      payment_status: 'PAID',
      order_timestamp: new Date().toISOString(),
      time_display: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      total_amount: 540,
      customer_name: 'Rahul Sharma',
      customer_phone: '9876543210',
      upi_txn_id: 'NPCI992837418293',
      items: [
        {
          id: 'popcorn-cheese-large',
          name: 'Cheese Gourmet Popcorn',
          price: 240,
          quantity: 2,
          category: 'popcorn',
          isVeg: true,
          size: 'Large Tub (180g)',
          flavor: 'Cheese',
        },
        {
          id: 'beverage-coke-zero',
          name: 'Coca-Cola Zero Sugar',
          price: 150,
          quantity: 1,
          category: 'beverages',
          isVeg: true,
          size: 'Large (500ml)',
        },
      ],
      progress_status: 'PAID',
    };

    setTestingStatus('TESTING');
    setTestMessage('Sending full formatted Cinema Kitchen Slip...');

    const res = await printerStore.dispatchPrintJob(sampleOrder, {
      host: hostInput.trim(),
      port: Number(portInput),
    });

    if (res.success) {
      setTestingStatus('SUCCESS');
      setTestMessage(`Receipt printed to kitchen counter! ${res.message}`);
      fetchLogs();
    } else {
      setTestingStatus('ERROR');
      setTestMessage(`Print failed: ${res.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-neutral-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Kitchen Counter Thermal Printer
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                  Auto-Print Active
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Direct ESC/POS TCP Socket stream to online virtual emulator or physical 80mm/58mm POS printers
              </p>
            </div>
          </div>
        </div>

        {/* Live Workspace Link */}
        <a
          href="https://virtual-printer.online/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 text-amber-300 text-xs font-semibold transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-amber-400" />
          <span>Open virtual-printer.online Console</span>
        </a>
      </div>

      {/* Main Grid: Settings & Live Monitor */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Connection Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Host & Port Setup */}
          <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">POS Thermal Printer Endpoint</h3>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">Protocol: ESC/POS Raw TCP</span>
            </div>

            <div className="mt-4 space-y-4">
              {/* Host Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Printer Host / IP Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={hostInput}
                    onChange={(e) => setHostInput(e.target.value)}
                    placeholder="virtual-printer.online or 192.168.1.100"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Default: <code className="text-amber-300">virtual-printer.online</code> for virtual testing, or local LAN IP (e.g. <code className="text-neutral-300">192.168.1.87</code>) when shipping.
                </p>
              </div>

              {/* Port & Protocol */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    TCP Port
                  </label>
                  <input
                    type="number"
                    value={portInput}
                    onChange={(e) => setPortInput(Number(e.target.value))}
                    placeholder="9359 or 9100"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Online emulator: <strong className="text-neutral-200">9359</strong>. Standard physical hardware: <strong className="text-neutral-200">9100</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Workspace / Security Token
                  </label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="epic-wolf-2904"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Workspace: <code className="text-amber-300">epic-wolf-2904</code>
                  </p>
                </div>
              </div>

              {/* Toggle: Automatic Printing on Order Placement */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-white block">
                    Automatic Print on Payment
                  </span>
                  <span className="text-xs text-neutral-400">
                    Immediately fires ESC/POS ticket to kitchen when UPI payment authorizes
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPrint}
                    onChange={(e) => setAutoPrint(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>

                <button
                  onClick={handleTestConnection}
                  disabled={testingStatus === 'TESTING'}
                  className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs border border-neutral-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {testingStatus === 'TESTING' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>Test Connection</span>
                </button>

                <button
                  onClick={handleSendSampleSlip}
                  disabled={testingStatus === 'TESTING'}
                  className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Print Sample Ticket</span>
                </button>

                <button
                  onClick={handleResetDefaults}
                  className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-400 font-medium text-xs border border-neutral-800 transition-colors"
                >
                  Reset Defaults
                </button>
              </div>

              {/* Status alerts */}
              {savedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Printer endpoint updated and saved!</span>
                </div>
              )}

              {testingStatus === 'SUCCESS' && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Transmission Succeeded</span>
                    <span>{testMessage}</span>
                  </div>
                </div>
              )}

              {testingStatus === 'ERROR' && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Transmission Failed</span>
                    <span>{testMessage}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Production Readiness & Shipping Guide */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Production Hardware Deployment Checklist</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              When transitioning from this virtual printer to physical theater counter hardware:
            </p>
            <div className="mt-3 space-y-2 text-xs text-neutral-300">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-2">
                <span className="text-amber-400 font-bold">1.</span>
                <span><strong>Ethernet / Wi-Fi POS:</strong> Connect any standard ESC/POS thermal printer (e.g. Epson TM-T88, TVS, Rongta, NGX) to the theater kitchen LAN.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-2">
                <span className="text-amber-400 font-bold">2.</span>
                <span><strong>Static IP:</strong> Assign a static IP (e.g. <code className="text-amber-300 font-mono">192.168.1.150</code>) and set Port to <code className="text-amber-300 font-mono">9100</code> here.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start gap-2">
                <span className="text-amber-400 font-bold">3.</span>
                <span><strong>Zero Drivers Required:</strong> The CineSnack backend directly builds standard raw ESC/POS byte streams with hardware auto-cut commands (<code className="text-neutral-400 font-mono">GS V 66 0</code>).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live ESC/POS Preview & Dispatch Logs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: What gets printed */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">80mm Ticket Template</h3>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                Kitchen Runner Copy
              </span>
            </div>

            {/* Thermal paper slip styling */}
            <div className="mt-4 p-4 rounded-2xl bg-neutral-100 text-neutral-950 font-mono text-[11px] leading-tight shadow-inner border border-neutral-300 select-text overflow-x-auto">
              <div className="text-center font-bold text-xs pb-1 border-b border-dashed border-neutral-400">
                GRAND CINEPLEX<br/>
                KITCHEN DISPATCH &amp; F&amp;B TICKET
              </div>

              <div className="text-center py-2 border-b border-dashed border-neutral-400">
                <div className="text-base font-black">TOKEN #94</div>
                <div className="font-bold text-xs">Audi 3 [SEAT F12]</div>
                <div className="text-[10px] text-neutral-700">★ SEAT DELIVERY ★</div>
              </div>

              <div className="py-2 border-b border-dashed border-neutral-400 text-[10px]">
                Order ID: #ORD-8821<br/>
                Placed At: {new Date().toLocaleTimeString()}<br/>
                Payment: 0% MDR UPI (PAID)<br/>
                NPCI Ref: NPCI992837418293
              </div>

              <div className="py-2 border-b border-dashed border-neutral-400">
                <div className="font-bold text-[10px] mb-1">ITEMS TO PREPARE:</div>
                <div className="font-bold">1. [ 2x ] Cheese Gourmet Popcorn (Large)</div>
                <div className="text-[10px] text-neutral-600 pl-3">Flavors: [Cheese]</div>
                <div className="font-bold mt-1">2. [ 1x ] Coca-Cola Zero Sugar (Large)</div>
              </div>

              <div className="pt-2 text-right font-bold">
                TOTAL: Rs. 540.00
              </div>

              <div className="text-center text-[10px] pt-3 text-neutral-600 border-t border-dashed border-neutral-400 mt-2">
                ** DISPATCH TO AUDITORIUM RUNNER **<br/>
                CineSnack Direct POS-80 System
              </div>
            </div>
          </div>

          {/* Card: Live Transmission Logs */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Live Print Dispatch Logs</h3>
              </div>
              <button
                onClick={fetchLogs}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Refresh logs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 text-center text-xs text-neutral-500">
                  No print jobs recorded yet. Place an order or click "Test Connection" to see live transmissions.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs font-mono flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span className="font-bold text-white">Token #{log.token_number}</span>
                        <span className="text-[10px] text-neutral-400">{log.host}:{log.port}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5 max-w-[220px]">
                        {log.message}
                      </p>
                    </div>
                    <span className="text-[10px] text-neutral-500 shrink-0">{log.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
