import { Order } from '../types';

export interface PrinterConfig {
  enabled: boolean;
  type: 'tcp_raw' | 'browser_popup';
  host: string;
  port: number;
  protocol: string;
  workspaceToken?: string;
  autoPrintOnPayment: boolean;
  printCutPaper: boolean;
  numCopies: number;
}

const PRINTER_STORAGE_KEY = 'cinesnack_printer_config_v1';

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  enabled: true,
  type: 'tcp_raw',
  host: 'virtual-printer.online',
  port: 9359,
  protocol: 'ESCPOS emulation',
  workspaceToken: 'epic-wolf-2904',
  autoPrintOnPayment: true,
  printCutPaper: true,
  numCopies: 1,
};

class PrinterStore {
  private config: PrinterConfig = DEFAULT_PRINTER_CONFIG;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(PRINTER_STORAGE_KEY);
        if (stored) {
          this.config = { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(stored) };
        } else {
          this.saveToStorage();
        }
      } catch {
        this.config = DEFAULT_PRINTER_CONFIG;
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(this.config));
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public getConfig(): PrinterConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<PrinterConfig>) {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    this.saveToStorage();
  }

  public resetToDefault() {
    this.config = DEFAULT_PRINTER_CONFIG;
    this.saveToStorage();
  }

  /**
   * Dispatch thermal print job to the backend thermal printer bridge
   */
  public async dispatchPrintJob(order: Order, options?: { host?: string; port?: number }): Promise<{ success: boolean; message: string; log?: string }> {
    const activeConfig = this.config;
    const targetHost = options?.host || activeConfig.host;
    const targetPort = options?.port || activeConfig.port;

    try {
      const response = await fetch('/api/printer/print-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order,
          printerHost: targetHost,
          printerPort: targetPort,
          token: activeConfig.workspaceToken,
        }),
      });

      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Network bridge error connecting to backend printer service',
      };
    }
  }

  /**
   * Test connection to configured TCP / Virtual Printer
   */
  public async testPrinterConnection(customHost?: string, customPort?: number): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const host = customHost || this.config.host;
    const port = customPort || this.config.port;

    try {
      const response = await fetch('/api/printer/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host,
          port,
          token: this.config.workspaceToken,
        }),
      });

      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: `Could not reach test endpoint: ${err.message}`,
      };
    }
  }
}

export const printerStore = new PrinterStore();
