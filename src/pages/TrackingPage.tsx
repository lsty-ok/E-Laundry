import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Printer,
  Package,
  AlertCircle,
} from 'lucide-react';
import { useLaundry } from '../context/LaundryContext';
import { QUEUE_STATUS_FLOW, formatRupiah, formatWIB } from '../utils/laundryRules';
import type { Order } from '../types/laundry';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';

export const TrackingPage: React.FC = () => {
  const { state } = useLaundry();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [submittedQuery, setSubmittedQuery] = useState(searchParams.get('q') ?? '');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const matchedOrders = useMemo(() => {
    const q = submittedQuery.trim().toLowerCase();
    if (!q) return [];
    const digitsOnly = q.replace(/\D/g, '');
    return state.orders.filter((o) => {
      if (o.orderNumber.toLowerCase().includes(q)) return true;
      if (digitsOnly.length >= 6) {
        const orderDigits = o.customerPhone.replace(/\D/g, '');
        if (orderDigits.includes(digitsOnly) || orderDigits.endsWith(digitsOnly.replace(/^0/, ''))) {
          return true;
        }
      }
      return false;
    });
  }, [state.orders, submittedQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query);
  };

  return (
    <div className="bg-[#F4F8FF] min-h-[80vh] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold tracking-wider text-[#1D4ED8]">LACAK CUCIAN LIVE</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082B78]">
            Cek Status Cucian Anda
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Masukkan nomor nota (<span className="font-mono">LDR-YYYYMMDD-0001</span>) atau nomor
            WhatsApp terdaftar untuk memantau tahapan proses secara real-time.
          </p>
        </div>

        {/* Search Box */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="h-5 w-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                aria-label="Nomor Nota atau Nomor HP"
                placeholder="Contoh: LDR-20261123-0001 atau +6281234567890"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-3 text-sm font-mono focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white px-6 py-3 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              Lacak Sekarang
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Coba contoh cepat:</span>
            {state.orders.slice(0, 3).map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setQuery(sample.orderNumber);
                  setSubmittedQuery(sample.orderNumber);
                }}
                className="font-mono text-[#0B3FA8] hover:underline font-semibold cursor-pointer"
              >
                {sample.orderNumber}
              </button>
            ))}
          </div>
        </form>

        {/* Results */}
        {submittedQuery.trim() && matchedOrders.length === 0 && (
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Pesanan tidak ditemukan</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Pastikan nomor nota (contoh <span className="font-mono">LDR-20261123-0001</span>)
              atau nomor HP Anda sudah benar.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {matchedOrders.map((order) => {
            const currentIdx = QUEUE_STATUS_FLOW.indexOf(order.queueStatus);
            return (
              <article
                key={order.id}
                data-testid={`tracking-result-${order.orderNumber}`}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden"
              >
                <div className="bg-[#082B78] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-blue-200">Nomor Nota</p>
                    <h2 className="font-mono text-lg font-extrabold">{order.orderNumber}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-200">Status Saat Ini</p>
                    <p className="text-sm font-extrabold text-[#FACC15]">
                      {order.queueStatus.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Meta summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm border-b border-slate-100 pb-5">
                    <div>
                      <p className="text-xs text-slate-500">Pelanggan</p>
                      <p className="font-bold text-slate-900">{order.customerName}</p>
                      <p className="text-xs font-mono text-slate-500">{order.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Estimasi Selesai</p>
                      <p className="font-bold text-[#0B3FA8] inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {formatWIB(order.estimatedFinishAt)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Kecepatan: {order.speed} · {order.paymentStatus} ({formatRupiah(order.total)})
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Pengantaran</p>
                      <p className="font-bold text-slate-900 inline-flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
                        {order.pickupDelivery ? order.deliveryState ?? 'Dijadwalkan' : 'Ambil di Outlet'}
                      </p>
                      {order.courierName && (
                        <p className="text-xs text-slate-500">Kurir: {order.courierName}</p>
                      )}
                    </div>
                  </div>

                  {/* 6-Stage Timeline */}
                  <div>
                    <h3 className="text-xs font-bold tracking-wider text-slate-500 mb-4">
                      TAHAPAN PROSES CUCIAN
                    </h3>
                    <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {QUEUE_STATUS_FLOW.map((stage, idx) => {
                        const isDone = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        const logEntry = order.queueLogs.find((l) => l.status === stage);
                        return (
                          <li
                            key={stage}
                            className={`rounded-xl border p-3 text-center transition-colors ${
                              isCurrent
                                ? 'border-[#1D4ED8] bg-blue-50 ring-2 ring-blue-100'
                                : isDone
                                ? 'border-emerald-200 bg-emerald-50/60'
                                : 'border-slate-200 bg-slate-50/50 opacity-65'
                            }`}
                          >
                            <span
                              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                isCurrent
                                  ? 'bg-[#1D4ED8] text-white'
                                  : isDone
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                            </span>
                            <p className="mt-2 text-xs font-bold text-slate-900">
                              {stage === 'Siap' ? 'Siap Diambil' : stage}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              {logEntry
                                ? formatWIB(logEntry.timestamp).slice(0, 12)
                                : isDone
                                ? 'Tercatat'
                                : 'Menunggu'}
                            </p>
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  {/* Item Details & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Package className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
                      <span>
                        {order.items
                          .map((i) => `${i.serviceName} (${i.quantity} ${i.unit})`)
                          .join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                        Lihat Nota
                      </button>
                      <Link
                        to={`/pesan?service=${order.items[0]?.serviceId ?? ''}&qty=${
                          order.items[0]?.quantity ?? 4
                        }`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0B3FA8]"
                      >
                        Pesan Ulang
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <ThermalReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </div>
  );
};
