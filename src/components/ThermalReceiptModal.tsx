import React from 'react';
import { Printer, MessageCircle, X } from 'lucide-react';
import type { Order } from '../types/laundry';
import { formatRupiah, formatWIB } from '../utils/laundryRules';
import { useLaundry } from '../context/LaundryContext';
import { QrCodeSvg } from './QrCodeSvg';

interface ThermalReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ order, onClose }) => {
  const { state, sendManualWhatsApp } = useLaundry();
  if (!order) return null;

  const remaining = Math.max(0, order.total - order.paidAmount);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWA = () => {
    const summaryLines = order.items
      .map((i) => `${i.serviceName} (${i.quantity} ${i.unit}) = ${formatRupiah(i.subtotal)}`)
      .join(', ');
    const message = `Nota Digital ${state.settings.businessName}\nNo. Nota: ${order.orderNumber}\nPelanggan: ${order.customerName}\nLayanan: ${summaryLines}\nTotal: ${formatRupiah(order.total)} (${order.paymentStatus})\nEstimasi Selesai: ${formatWIB(order.estimatedFinishAt)}\nCek status live di website kami.`;
    sendManualWhatsApp({
      phone: order.customerPhone,
      name: order.customerName,
      message,
      templateKey: 'order_received',
      orderNumber: order.orderNumber,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Nota Thermal ${order.orderNumber}`}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Preview Struk Thermal 58mm</h3>
            <p className="text-xs text-slate-500 font-mono">{order.orderNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup preview struk"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto flex justify-center bg-slate-100/70">
          {/* Authentic 58mm thermal paper preview */}
          <div
            id="thermal-receipt-print"
            className="w-[240px] bg-white border border-dashed border-slate-300 p-4 font-mono text-[11px] leading-relaxed text-slate-900 shadow-xs"
          >
            <div className="text-center border-b border-dashed border-slate-400 pb-2.5 mb-2.5">
              <p className="font-bold text-sm tracking-tight">{state.settings.businessName.toUpperCase()}</p>
              <p className="text-[10px]">{state.settings.tagline}</p>
              <p className="text-[10px] mt-1">{state.settings.address}</p>
              <p className="text-[10px]">WA: {state.settings.whatsapp}</p>
            </div>

            <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2 mb-2 text-[10px]">
              <div className="flex justify-between">
                <span>No. Nota</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal</span>
                <span>{formatWIB(order.createdAt).replace(' WIB', '')}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan</span>
                <span className="truncate max-w-[120px]">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Layanan</span>
                <span>
                  {order.model === 'self-service'
                    ? 'Self-Service'
                    : order.model === 'hybrid'
                    ? 'Hybrid'
                    : 'Full-Service'}{' '}
                  ({order.speed})
                </span>
              </div>
            </div>

            <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-2 mb-2">
              {order.items.map((item) => (
                <div key={item.id}>
                  <p className="font-semibold">{item.serviceName}</p>
                  <div className="flex justify-between text-[10px] tabular-nums">
                    <span>
                      {item.quantity} {item.unit} x {formatRupiah(item.unitPrice)}
                    </span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
              {order.addons.map((addon) => (
                <div key={addon.id} className="flex justify-between text-[10px] tabular-nums">
                  <span>+ {addon.name}</span>
                  <span>{formatRupiah(addon.price)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2 mb-2 text-[10px] tabular-nums">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Antar-Jemput</span>
                  <span>{formatRupiah(order.deliveryFee)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span>Diskon ({order.promoCode})</span>
                  <span>-{formatRupiah(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                <span>TOTAL</span>
                <span>{formatRupiah(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Dibayar ({order.paymentMethod})</span>
                <span>{formatRupiah(order.paidAmount)}</span>
              </div>
              {remaining > 0 && (
                <div className="flex justify-between font-bold">
                  <span>SISA TAGIHAN</span>
                  <span>{formatRupiah(remaining)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Status Bayar</span>
                <span className="font-bold">{order.paymentStatus.toUpperCase()}</span>
              </div>
            </div>

            <div className="text-center pt-1">
              <p className="text-[10px] mb-1.5">Est. Selesai: {formatWIB(order.estimatedFinishAt)}</p>
              <QrCodeSvg value={order.orderNumber} size={96} label={order.orderNumber} />
              <p className="text-[9px] mt-2 text-slate-600">
                Scan QR / masukkan nomor nota di website E-Laundry untuk cek status cucian.
              </p>
              <p className="text-[10px] font-bold mt-1">Terima Kasih!</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-200 bg-white">
          <button
            type="button"
            onClick={handleSendWA}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            Kirim Nota via WhatsApp
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B3FA8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk 58mm
          </button>
        </div>
      </div>
    </div>
  );
};
