import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HsvaColorPicker } from 'react-colorful';

type HSVA = { h: number; s: number; v: number; a: number };
type RGB  = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '').padEnd(6, '0');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsva({ r, g, b }: RGB): HSVA {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  let h = 0;
  if (d) {
    if (max === rn) h = ((gn - bn) / d + 6) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h, s: max ? (d / max) * 100 : 0, v: max * 100, a: 1 };
}

function hsvaToRgb({ h, s, v }: HSVA): RGB {
  const sv = s / 100, vv = v / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return vv - vv * sv * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
}

function hsvaToHex(hsva: HSVA): string { return rgbToHex(hsvaToRgb(hsva)); }
function hexToHsva(hex: string): HSVA  { return rgbToHsva(hexToRgb(hex)); }

interface Props {
  color: string;
  onChange: (hex: string) => void;
}

export default function ColorPicker({ color, onChange }: Props) {
  const [open, setOpen]     = useState(false);
  const [hsva, setHsva]     = useState<HSVA>(() => hexToHsva(color));
  const [hexInput, setHexInput] = useState(color.replace('#', '').toUpperCase());
  const [popupPos, setPopupPos] = useState({ top: 0, right: 0 });
  const swatchRef  = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHsva(hexToHsva(color));
    setHexInput(color.replace('#', '').toUpperCase());
  }, [color]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleHsvaChange = useCallback((next: HSVA) => {
    setHsva(next);
    const hex = hsvaToHex(next);
    setHexInput(hex.replace('#', '').toUpperCase());
    onChange(hex);
  }, [onChange]);

  const handleHexInput = (raw: string) => {
    const val = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
    setHexInput(val);
    if (val.length === 6) {
      const hex = '#' + val;
      setHsva(hexToHsva(hex));
      onChange(hex);
    }
  };

  const handleRgbInput = (channel: 'r' | 'g' | 'b', raw: string) => {
    const num = Math.max(0, Math.min(255, parseInt(raw) || 0));
    const rgb = hsvaToRgb(hsva);
    const next = { ...rgb, [channel]: num };
    const hex  = rgbToHex(next);
    setHsva(hexToHsva(hex));
    setHexInput(hex.replace('#', '').toUpperCase());
    onChange(hex);
  };

  const rgb = hsvaToRgb(hsva);

  const handleSwatchClick = () => {
    if (!swatchRef.current) return;
    const rect = swatchRef.current.getBoundingClientRect();
    setPopupPos({
      top: rect.top - 8,
      right: window.innerWidth - rect.right,
    });
    setOpen(o => !o);
  };

  const popup = open && (
    <div
      ref={popoverRef}
      style={{ position: 'fixed', top: popupPos.top, right: popupPos.right, transform: 'translateY(-100%)', zIndex: 99999 }}
      className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-4 w-72"
    >

          <style>{`
            .custom-picker { width: 100% !important; }
            .custom-picker .react-colorful__saturation {
              border-radius: 10px 10px 0 0;
              height: 180px;
            }
            .custom-picker .react-colorful__hue,
            .custom-picker .react-colorful__alpha {
              height: 14px;
              border-radius: 7px;
              margin-top: 10px;
            }
            .custom-picker .react-colorful__pointer {
              width: 18px;
              height: 18px;
              border: 2px solid #fff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            }
          `}</style>
          <HsvaColorPicker
            color={hsva}
            onChange={handleHsvaChange}
            className="custom-picker"
          />

          <div className="mt-4 flex gap-2">
            <div className="flex-1">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Hex</p>
              <div className="flex items-center bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 gap-1">
                <span className="text-zinc-500 text-xs">#</span>
                <input
                  value={hexInput}
                  onChange={e => handleHexInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-zinc-200 outline-none font-mono min-w-0"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            {(['r', 'g', 'b'] as const).map(ch => (
              <div key={ch}>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">{ch}</p>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[ch]}
                  onChange={e => handleRgbInput(ch, e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#c4ff0d]/50 font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            ))}
          </div>

          <div
            className="mt-3 h-6 rounded-lg border border-white/10"
            style={{ background: `linear-gradient(to right, #000, ${color})` }}
          />
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={swatchRef}
        onClick={handleSwatchClick}
        className="w-10 h-10 rounded-lg border-2 border-white/30 hover:border-[#c4ff0d]/60 transition-all shadow-lg"
        style={{ background: color }}
        title={color}
      />
      {popup && createPortal(popup, document.body)}
    </div>
  );
}
