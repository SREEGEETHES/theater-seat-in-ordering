import React, { useState } from 'react';
import { QrCode, MapPin, X, Check, Film, Sparkles } from 'lucide-react';
import { SeatLocation } from '../types';

interface SeatSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSeat: SeatLocation;
  onSelectSeat: (seat: SeatLocation) => void;
}

const AUDITORIUMS = ['Audi 1', 'Audi 2', 'Audi 3 (Dolby Atmos)', 'Audi 4 (IMAX Laser)', 'Screen 02', 'Screen 05'];
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N'];
const SEAT_NUMBERS = Array.from({ length: 24 }, (_, i) => `${i + 1}`);

const QUICK_PRESETS: SeatLocation[] = [
  { screen: 'Audi 3', row: 'F', seat: '12' },
  { screen: 'Screen 02', row: 'M', seat: '14' },
  { screen: 'Audi 4 (IMAX Laser)', row: 'H', seat: '8' },
  { screen: 'Audi 1', row: 'C', seat: '04' },
];

export const SeatSelectorModal: React.FC<SeatSelectorModalProps> = ({
  isOpen,
  onClose,
  currentSeat,
  onSelectSeat,
}) => {
  const [selectedScreen, setSelectedScreen] = useState(currentSeat.screen);
  const [selectedRow, setSelectedRow] = useState(currentSeat.row);
  const [selectedSeatNum, setSelectedSeatNum] = useState(currentSeat.seat);

  if (!isOpen) return null;

  const handleApply = () => {
    onSelectSeat({
      screen: selectedScreen,
      row: selectedRow,
      seat: selectedSeatNum,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 text-neutral-100 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Simulate Seat QR Scan</h3>
              <p className="text-xs text-neutral-400">Locked in-seat location routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Seat Presets */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
            Preset Demo Armrest Stickers
          </label>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PRESETS.map((preset, idx) => {
              const isCurrent =
                preset.screen === selectedScreen &&
                preset.row === selectedRow &&
                preset.seat === selectedSeatNum;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedScreen(preset.screen);
                    setSelectedRow(preset.row);
                    setSelectedSeatNum(preset.seat);
                  }}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-semibold'
                      : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div>
                    <div className="font-medium text-white">{preset.screen}</div>
                    <div className="text-[11px] text-amber-400">Row {preset.row}, Seat {preset.seat}</div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Seat Selection */}
        <div className="mt-5 space-y-4">
          {/* Screen / Audi Selector */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
              Auditorium / Screen
            </label>
            <select
              value={selectedScreen}
              onChange={(e) => setSelectedScreen(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
            >
              {AUDITORIUMS.map((audi) => (
                <option key={audi} value={audi}>
                  {audi}
                </option>
              ))}
            </select>
          </div>

          {/* Row & Seat Number grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Row (Armrest)
              </label>
              <select
                value={selectedRow}
                onChange={(e) => setSelectedRow(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
              >
                {ROWS.map((r) => (
                  <option key={r} value={r}>
                    Row {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Seat Number
              </label>
              <select
                value={selectedSeatNum}
                onChange={(e) => setSelectedSeatNum(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
              >
                {SEAT_NUMBERS.map((s) => (
                  <option key={s} value={s}>
                    Seat {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected preview pill */}
        <div className="mt-5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Target Location for Delivery:</span>
          </div>
          <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {selectedScreen} • Row {selectedRow}, Seat {selectedSeatNum}
          </span>
        </div>

        {/* Action button */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Lock In Seat
          </button>
        </div>
      </div>
    </div>
  );
};
