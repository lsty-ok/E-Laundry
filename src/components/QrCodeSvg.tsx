import React from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  label?: string;
}

/**
 * Deterministic visual QR-style matrix SVG (no external image requests)
 * for thermal 58mm receipts and simulated QRIS payment screens.
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({ value, size = 128, label }) => {
  const cells = 21;
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const isFinder = (r: number, c: number) => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= cells - 7;
    const inBottomLeft = r >= cells - 7 && c < 7;
    return inTopLeft || inTopRight || inBottomLeft;
  };

  const finderCell = (r: number, c: number) => {
    const lr = r >= cells - 7 ? r - (cells - 7) : r;
    const lc = c >= cells - 7 ? c - (cells - 7) : c;
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  };

  const rects: React.ReactElement[] = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      let filled = false;
      if (isFinder(r, c)) {
        filled = finderCell(r, c);
      } else {
        const seed = (hash ^ ((r + 1) * 73856093) ^ ((c + 1) * 19349663)) >>> 0;
        filled = seed % 3 !== 0;
      }
      if (filled) {
        rects.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0F172A" />);
      }
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${cells} ${cells}`}
        role="img"
        aria-label={label ?? `Kode QR ${value}`}
        className="bg-white p-1.5 rounded-lg border border-slate-200"
      >
        <rect x={0} y={0} width={cells} height={cells} fill="#FFFFFF" />
        {rects}
      </svg>
      {label && <span className="text-[11px] font-mono text-slate-600">{label}</span>}
    </div>
  );
};
