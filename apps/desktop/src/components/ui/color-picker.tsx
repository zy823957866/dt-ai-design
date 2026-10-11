'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  showAlpha?: boolean;
  alpha?: number;
  onChange: (color: string) => void;
  onAlphaChange?: (alpha: number) => void;
  className?: string;
}

const PRESET_COLORS = [
  '#000000',
  '#1f2937',
  '#374151',
  '#4b5563',
  '#6b7280',
  '#9ca3af',
  '#d1d5db',
  '#e5e7eb',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#7c2d12',
  '#78350f',
  '#713f12',
  '#365314',
  '#064e3b',
  '#164e63',
  '#1e3a5f',
  '#312e81',
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')
  );
}

function rgbToHsv(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToRgb(
  h: number,
  s: number,
  v: number,
): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  v /= 100;
  let r = 0,
    g = 0,
    b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}

function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

function isValidHex(hex: string): boolean {
  return /^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex);
}

function normalizeHex(hex: string): string {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return '#' + h.toUpperCase();
}

export function ColorPicker({
  value,
  showAlpha = false,
  alpha = 1,
  onChange,
  onAlphaChange,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const rgb = hexToRgb(value);
  const [hsv, setHsv] = useState(() => rgbToHsv(rgb.r, rgb.g, rgb.b));
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const svRef = useRef<HTMLDivElement>(null);
  const isDraggingSV = useRef(false);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingHue = useRef(false);
  const alphaRef = useRef<HTMLDivElement>(null);
  const isDraggingAlpha = useRef(false);

  useEffect(() => {
    setHexInput(value);
    const c = hexToRgb(value);
    setHsv(rgbToHsv(c.r, c.g, c.b));
  }, [value]);

  const commitColor = useCallback(
    (hex: string) => {
      const normalized = normalizeHex(hex);
      onChange(normalized);
      setRecentColors((prev) => {
        const filtered = prev.filter(
          (x) => x.toLowerCase() !== normalized.toLowerCase(),
        );
        return [normalized, ...filtered].slice(0, 8);
      });
    },
    [onChange],
  );

  const handleSVMouseDown = (e: React.MouseEvent) => {
    isDraggingSV.current = true;
    updateSV(e.clientX, e.clientY);
    const handleMove = (ev: MouseEvent) => updateSV(ev.clientX, ev.clientY);
    const handleUp = () => {
      isDraggingSV.current = false;
      commitColor(hsvToHex(hsv.h, hsv.s, hsv.v));
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const updateSV = (clientX: number, clientY: number) => {
    if (!svRef.current) return;
    const rect = svRef.current.getBoundingClientRect();
    const s = Math.min(
      100,
      Math.max(0, ((clientX - rect.left) / rect.width) * 100),
    );
    const v = Math.min(
      100,
      Math.max(0, 100 - ((clientY - rect.top) / rect.height) * 100),
    );
    setHsv((prev) => {
      const next = { ...prev, s, v };
      setHexInput(hsvToHex(next.h, next.s, next.v));
      return next;
    });
  };

  const handleHueMouseDown = (e: React.MouseEvent) => {
    isDraggingHue.current = true;
    updateHue(e.clientX);
    const handleMove = (ev: MouseEvent) => updateHue(ev.clientX);
    const handleUp = () => {
      isDraggingHue.current = false;
      commitColor(hsvToHex(hsv.h, hsv.s, hsv.v));
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const updateHue = (clientX: number) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const h = Math.min(
      360,
      Math.max(0, ((clientX - rect.left) / rect.width) * 360),
    );
    setHsv((prev) => {
      const next = { ...prev, h };
      setHexInput(hsvToHex(next.h, next.s, next.v));
      return next;
    });
  };

  const handleAlphaMouseDown = (e: React.MouseEvent) => {
    if (!showAlpha || !onAlphaChange) return;
    isDraggingAlpha.current = true;
    updateAlpha(e.clientX);
    const handleMove = (ev: MouseEvent) => updateAlpha(ev.clientX);
    const handleUp = () => {
      isDraggingAlpha.current = false;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const updateAlpha = (clientX: number) => {
    if (!alphaRef.current || !onAlphaChange) return;
    const rect = alphaRef.current.getBoundingClientRect();
    const a = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onAlphaChange(a);
  };

  const handleHexBlur = () => {
    if (isValidHex(hexInput)) {
      commitColor(hexInput);
    } else {
      setHexInput(value);
    }
  };

  const handlePresetClick = (color: string) => {
    commitColor(color);
  };

  const hueColor = hsvToHex(hsv.h, 100, 100);
  const displayColor = hsvToHex(hsv.h, hsv.s, hsv.v);
  const alphaPercent = Math.round(alpha * 100);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'relative h-6 w-6 cursor-pointer rounded border border-border-strong transition-all hover:border-brand-500',
            className,
          )}
          style={{ backgroundColor: value }}
          title={value}
        />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" sideOffset={6}>
        <div className="space-y-3">
          {/* Saturation/Value picker */}
          <div
            ref={svRef}
            className="relative h-36 w-full cursor-crosshair rounded-md overflow-hidden"
            style={{
              backgroundColor: hueColor,
              backgroundImage:
                'linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)',
            }}
            onMouseDown={handleSVMouseDown}
          >
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                backgroundColor: displayColor,
              }}
            />
          </div>

          {/* Hue slider */}
          <div
            ref={hueRef}
            className="relative h-3 w-full cursor-pointer rounded-full"
            style={{
              background:
                'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
            }}
            onMouseDown={handleHueMouseDown}
          >
            <div
              className="pointer-events-none absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white bg-white shadow"
              style={{ left: `${(hsv.h / 360) * 100}%` }}
            />
          </div>

          {/* Alpha slider */}
          {showAlpha && onAlphaChange && (
            <div
              ref={alphaRef}
              className="relative h-3 w-full cursor-pointer rounded-full"
              style={{
                background: `linear-gradient(to right, transparent, ${displayColor}), repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px`,
              }}
              onMouseDown={handleAlphaMouseDown}
            >
              <div
                className="pointer-events-none absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white bg-white shadow"
                style={{ left: `${alphaPercent}%` }}
              />
            </div>
          )}

          {/* Hex + alpha input */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label className="text-[10px] text-text-tertiary">HEX</Label>
              <Input
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                onBlur={handleHexBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleHexBlur()}
                className="h-7 uppercase text-xs"
              />
            </div>
            {showAlpha && onAlphaChange && (
              <div className="w-14">
                <Label className="text-[10px] text-text-tertiary">A</Label>
                <Input
                  type="number"
                  value={alphaPercent}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!isNaN(v) && v >= 0 && v <= 100) {
                      onAlphaChange(v / 100);
                    }
                  }}
                  className="h-7 text-xs text-right"
                  min={0}
                  max={100}
                />
              </div>
            )}
          </div>

          {/* Recent colors */}
          {recentColors.length > 0 && (
            <div>
              <Label className="text-[10px] text-text-tertiary">最近</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {recentColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-5 w-5 rounded border border-border transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                    onClick={() => commitColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Preset colors */}
          <div>
            <Label className="text-[10px] text-text-tertiary">预设</Label>
            <div className="mt-1 grid grid-cols-9 gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-5 w-5 rounded border border-border transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                  onClick={() => handlePresetClick(c)}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
