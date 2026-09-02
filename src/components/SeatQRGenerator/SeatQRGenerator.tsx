import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Printer, 
  Layers, 
  MapPin, 
  Download, 
  Smartphone, 
  Check, 
  ExternalLink,
  Film,
  Sparkles,
  Copy,
  Edit2,
  Sliders,
  Grid,
  FileDown
} from 'lucide-react';
import { SeatLocation } from '../../types';

interface SeatQRGeneratorProps {
  onLoadSeatInCustomerApp: (seat: SeatLocation) => void;
}

const DEFAULT_AUDITORIUMS = [
  'Audi 3',
  'Audi 1 (Dolby Atmos)',
  'Audi 2 (4DX)',
  'Audi 4 (IMAX Laser)',
  'Screen 02',
  'Gold Class Lounge A',
];

const ALL_POSSIBLE_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T'];

export const SeatQRGenerator: React.FC<SeatQRGeneratorProps> = ({
  onLoadSeatInCustomerApp,
}) => {
  // Auditorium custom naming
  const [auditoriumName, setAuditoriumName] = useState<string>('Audi 3');
  
  // Single Seat Settings
  const [singleRow, setSingleRow] = useState<string>('F');
  const [singleSeat, setSingleSeat] = useState<string>('12');

  // Batch Generation - Two Separate Flexible Controls:
  // 1. How many rows (or select number of rows from A upwards)
  const [batchRowCount, setBatchRowCount] = useState<number>(6); // e.g. Rows A to F
  // 2. How many seats per row
  const [batchSeatsPerRow, setBatchSeatsPerRow] = useState<number>(12); // e.g. 12 seats per row

  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Compute live absolute target URL for customer ordering
  const appBaseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://grandcineplex.com';

  const singleStickerUrl = `${appBaseUrl}?screen=${encodeURIComponent(auditoriumName)}&row=${singleRow}&seat=${singleSeat}`;

  const currentActiveBatchRows = ALL_POSSIBLE_ROWS.slice(0, Math.min(batchRowCount, ALL_POSSIBLE_ROWS.length));
  const totalStickersCount = currentActiveBatchRows.length * batchSeatsPerRow;

  const handleCopySingleUrl = () => {
    navigator.clipboard.writeText(singleStickerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintSheet = () => {
    window.print();
  };

  /**
   * 1-Click Download of All Batch Armrest Labels as a standalone printable HTML file
   */
  const handleDownloadAllBatchLabels = () => {
    const labels: Array<{ screen: string; row: string; seat: number; url: string }> = [];
    
    currentActiveBatchRows.forEach((row) => {
      for (let s = 1; s <= batchSeatsPerRow; s++) {
        const url = `${appBaseUrl}?screen=${encodeURIComponent(auditoriumName)}&row=${row}&seat=${s}`;
        labels.push({ screen: auditoriumName, row, seat: s, url });
      }
    });

    // Generate self-contained standalone printable HTML with QR codes rendered via Google Charts API or SVG
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Snack Box Armrest Stickers - ${auditoriumName}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 10px; background: #f5f5f5; color: #111; }
    .header-bar { text-align: center; margin-bottom: 15px; padding: 10px; background: #111; color: #fff; border-radius: 8px; }
    .header-bar h1 { margin: 0 0 4px 0; font-size: 18px; text-transform: uppercase; }
    .header-bar p { margin: 0; font-size: 12px; color: #aaa; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .sticker {
      background: #fff;
      border: 2px dashed #333;
      border-radius: 12px;
      padding: 10px 8px;
      text-align: center;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      height: 180px;
    }
    .cinema-brand { font-size: 10px; font-weight: 900; letter-spacing: 0.5px; border-bottom: 1.5px solid #111; padding-bottom: 2px; width: 100%; }
    .audi-tag { font-size: 9px; font-weight: 700; color: #555; margin-top: 4px; text-transform: uppercase; }
    .seat-badge { font-size: 16px; font-weight: 900; color: #111; margin: 2px 0 6px 0; }
    .qr-img { width: 85px; height: 85px; object-fit: contain; margin: 0 auto; }
    .instructions { font-size: 8px; font-weight: 800; text-transform: uppercase; margin-top: 4px; color: #222; }
    .footer-note { font-size: 7px; color: #777; }
    @media print {
      body { background: #fff; padding: 0; }
      .header-bar { display: none; }
      .grid { gap: 6px; }
      .sticker { border: 1.5px dashed #222; }
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <h1>Armrest Stickers: ${auditoriumName}</h1>
    <p>Total: ${labels.length} stickers (${currentActiveBatchRows.length} Rows × ${batchSeatsPerRow} Seats per row) • Snack Box In-Seat Dining</p>
  </div>
  <div class="grid">
    ${labels
      .map(
        (l) => `
      <div class="sticker">
        <div class="cinema-brand">🍿 SNACK BOX CINEMA</div>
        <div class="audi-tag">${l.screen}</div>
        <div class="seat-badge">ROW ${l.row} • SEAT ${l.seat}</div>
        <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
          l.url
        )}" alt="QR ${l.row}-${l.seat}" />
        <div class="instructions">SCAN TO ORDER SNACKS</div>
        <div class="footer-note">Fast In-Seat Delivery</div>
      </div>`
      )
      .join('')}
  </div>
  <script>
    window.onload = function() {
      // Auto-trigger print if requested
    };
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `armrest_stickers_${auditoriumName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${totalStickersCount}_labels.html`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 py-4 sm:py-6 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Hero */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Seat Armrest QR Sticker Studio
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Generate real camera-scannable QR stickers with custom auditorium names and batch download
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'single'
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Single Seat Sticker
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'batch'
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Auditorium Batch Studio
            </button>
          </div>
        </div>

        {/* Auditorium Name Customizer Bar (Affects both single & batch) */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 flex-1 w-full">
            <Edit2 className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="w-full">
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Auditorium Name / Screen Label (Freely Editable)
              </label>
              <input
                type="text"
                value={auditoriumName}
                onChange={(e) => setAuditoriumName(e.target.value)}
                placeholder="e.g. Audi 3, Screen 01 (Dolby Atmos), Gold Class"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] self-end sm:self-center">
            <span className="text-neutral-500 shrink-0">Presets:</span>
            {DEFAULT_AUDITORIUMS.slice(0, 4).map((p) => (
              <button
                key={p}
                onClick={() => setAuditoriumName(p)}
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors shrink-0"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'single' ? (
          /* Single Seat Sticker Mode */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Controls */}
            <div className="md:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Configure Single Seat Location</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1 font-medium">Row Letter</label>
                  <select
                    value={singleRow}
                    onChange={(e) => setSingleRow(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
                  >
                    {ALL_POSSIBLE_ROWS.map((r) => (
                      <option key={r} value={r}>Row {r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1 font-medium">Seat Number</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={singleSeat}
                    onChange={(e) => setSingleSeat(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              {/* Live Scannable Link Info */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Camera URL:</span>
                  </span>
                  <button
                    onClick={handleCopySingleUrl}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-semibold"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
                <div className="text-[11px] font-mono text-neutral-300 break-all bg-neutral-900/90 p-2 rounded-xl border border-neutral-800">
                  {singleStickerUrl}
                </div>
                <p className="text-[10px] text-neutral-500">
                  💡 Scan the QR on the right using your phone camera to instantly test ordering from {auditoriumName} Row {singleRow}, Seat {singleSeat}!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() =>
                    onLoadSeatInCustomerApp({
                      screen: auditoriumName,
                      row: singleRow,
                      seat: singleSeat,
                    })
                  }
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open Customer View in this Tab</span>
                </button>
              </div>
            </div>

            {/* Armrest Sticker Physical Mockup */}
            <div className="md:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
              <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-4 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Physical Armrest Sticker Preview</span>
              </span>

              {/* Physical Sticker Card with crisp QR */}
              <div className="w-72 bg-white text-neutral-950 rounded-2xl p-4 shadow-2xl border-2 border-neutral-200 relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-amber-600" />
                    <span className="font-black text-xs tracking-tight">SNACK BOX</span>
                  </div>
                  <span className="text-[9px] bg-neutral-900 text-white font-bold px-1.5 py-0.5 rounded">
                    IN-SEAT
                  </span>
                </div>

                {/* Audi & Seat Badge */}
                <div className="my-1.5 bg-neutral-100 p-2 rounded-xl border border-neutral-300">
                  <div className="text-[10px] font-bold text-neutral-700 uppercase truncate">
                    {auditoriumName}
                  </div>
                  <div className="text-2xl font-black text-neutral-950 tracking-tight">
                    ROW {singleRow} • SEAT {singleSeat}
                  </div>
                </div>

                {/* High Contrast QR Code */}
                <div className="my-3 flex justify-center">
                  <div className="p-2 border-2 border-neutral-900 rounded-xl bg-white shadow-sm">
                    <QRCodeSVG
                      value={singleStickerUrl}
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>

                {/* Footer instructions */}
                <div className="text-[10px] font-extrabold text-neutral-900 leading-tight">
                  SCAN WITH PHONE TO ORDER SNACKS
                </div>
                <div className="text-[8px] text-neutral-600 mt-0.5">
                  Delivered straight to your seat • Fast UPI Payment
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handlePrintSheet}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Single Label</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Batch Auditorium Studio Mode */
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-amber-400" />
                  <span>Auditorium Batch Armrest Sticker Generator</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Customize row count and seats per row, then download all labels with 1-click
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleDownloadAllBatchLabels}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                  title="Download self-contained offline HTML print file with all labels"
                >
                  <Download className="w-4 h-4" />
                  <span>1-Click Batch Download (.html)</span>
                </button>

                <button
                  onClick={handlePrintSheet}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Print Sheet</span>
                </button>
              </div>
            </div>

            {/* TWO SEPARATE FLEXIBLE CONTROLS AS REQUESTED */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
              {/* Control 1: How many rows */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-neutral-300 font-bold flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>1. Number of Rows</span>
                  </label>
                  <span className="text-xs font-bold text-amber-400">
                    {batchRowCount} Rows (A to {ALL_POSSIBLE_ROWS[batchRowCount - 1]})
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={ALL_POSSIBLE_ROWS.length}
                  value={batchRowCount}
                  onChange={(e) => setBatchRowCount(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="mt-1 flex justify-between text-[10px] text-neutral-500">
                  <span>1 Row</span>
                  <span>10 Rows</span>
                  <span>{ALL_POSSIBLE_ROWS.length} Rows</span>
                </div>
              </div>

              {/* Control 2: How many seats per row */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-neutral-300 font-bold flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>2. Seats per Row</span>
                  </label>
                  <span className="text-xs font-bold text-amber-400">
                    {batchSeatsPerRow} Seats/Row
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={batchSeatsPerRow}
                  onChange={(e) => setBatchSeatsPerRow(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="mt-1 flex justify-between text-[10px] text-neutral-500">
                  <span>2 Seats</span>
                  <span>15 Seats</span>
                  <span>30 Seats</span>
                </div>
              </div>

              {/* Summary Metric */}
              <div className="flex flex-col justify-center bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                  Batch Generation Summary
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {totalStickersCount} Armrest Stickers
                </div>
                <span className="text-[11px] text-neutral-400">
                  {auditoriumName} • {currentActiveBatchRows.length} Rows × {batchSeatsPerRow} Seats
                </span>
              </div>
            </div>

            {/* Generated Stickers Preview Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Stickers Preview Grid (Scrollable):</span>
                <span>Click "Test Seat" to preview in customer mode</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[480px] overflow-y-auto p-3 bg-neutral-950 rounded-2xl border border-neutral-800">
                {currentActiveBatchRows.map((row) =>
                  Array.from({ length: batchSeatsPerRow }, (_, i) => i + 1).map((seatNum) => {
                    const url = `${appBaseUrl}?screen=${encodeURIComponent(auditoriumName)}&row=${row}&seat=${seatNum}`;
                    return (
                      <div
                        key={`${row}-${seatNum}`}
                        className="bg-white text-neutral-950 p-2.5 rounded-xl text-center shadow-sm border border-neutral-300 flex flex-col items-center justify-between"
                      >
                        <div className="text-[9px] font-bold text-neutral-700 leading-none truncate w-full">
                          {auditoriumName}
                        </div>
                        <div className="text-xs font-black text-neutral-950 my-1">
                          ROW {row} • SEAT {seatNum}
                        </div>
                        <div className="bg-white p-1 rounded border border-neutral-300">
                          <QRCodeSVG value={url} size={70} level="L" />
                        </div>
                        <button
                          onClick={() =>
                            onLoadSeatInCustomerApp({
                              screen: auditoriumName,
                              row,
                              seat: `${seatNum}`,
                            })
                          }
                          className="mt-1.5 text-[9px] bg-amber-500 text-neutral-950 font-bold px-2 py-0.5 rounded hover:bg-amber-400 transition-colors"
                        >
                          Test Seat
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
