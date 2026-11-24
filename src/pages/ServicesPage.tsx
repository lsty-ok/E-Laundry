import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, Clock, WashingMachine } from 'lucide-react';
import { useLaundry } from '../context/LaundryContext';
import { formatRupiah } from '../utils/laundryRules';
import type { ServiceCategory } from '../types/laundry';

const CATEGORY_TABS: { key: 'semua' | ServiceCategory; label: string }[] = [
  { key: 'semua', label: 'Semua Layanan' },
  { key: 'kiloan', label: 'Kiloan' },
  { key: 'satuan', label: 'Satuan & Setrika' },
  { key: 'self-service', label: 'Self-Service' },
  { key: 'dry-cleaning', label: 'Dry Cleaning' },
  { key: 'sepatu', label: 'Sepatu' },
  { key: 'bedcover', label: 'Bedcover' },
  { key: 'express', label: 'Express' },
  { key: 'khusus', label: 'Perawatan Khusus' },
];

export const ServicesPage: React.FC = () => {
  const { state } = useLaundry();
  const [selectedCategory, setSelectedCategory] = useState<'semua' | ServiceCategory>('semua');

  const activeServices = state.services.filter((s) => s.active);
  const filtered =
    selectedCategory === 'semua'
      ? activeServices
      : activeServices.filter((s) => s.category === selectedCategory);

  return (
    <div className="bg-slate-50/50 min-h-[75vh] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-wider text-[#1D4ED8]">KATALOG LAYANAN</p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold text-[#082B78]">
              Pilih Layanan Laundry Sesuai Kebutuhan
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
              Tersedia layanan Kiloan, Satuan, Self-Service, Dry Cleaning, Cuci Sepatu, Bedcover,
              hingga Express 24 Jam &amp; Premium Hari Sama.
            </p>
          </div>
          <Link
            to="/kalkulator"
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B3FA8] hover:bg-blue-50 whitespace-nowrap self-start md:self-auto"
          >
            <Calculator className="h-4 w-4" aria-hidden="true" />
            Simulasi Biaya
          </Link>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
          {CATEGORY_TABS.map((tab) => {
            const active = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#0B3FA8] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Services List */}
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-white border border-slate-200 p-10 text-center space-y-3">
            <WashingMachine className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Belum ada layanan aktif pada kategori ini.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('semua')}
              className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
            >
              Tampilkan semua layanan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((srv) => (
              <article
                key={srv.id}
                className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs flex flex-col"
              >
                <div className="h-48 bg-blue-50 overflow-hidden">
                  <img
                    src={srv.imageUrl}
                    alt={srv.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {srv.model === 'self-service'
                        ? 'Self-Service'
                        : srv.model === 'hybrid'
                        ? 'Hybrid / Satuan'
                        : 'Full-Service'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden="true" />
                      {srv.estimatedHours <= 1 ? '40–45 menit' : `Est. ${srv.estimatedHours} jam`}
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-lg font-extrabold text-[#082B78]">{srv.name}</h2>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed flex-1">
                    {srv.description}
                  </p>

                  <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100 p-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[11px] text-slate-500">Reguler</p>
                      <p className="text-xs font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                        {formatRupiah(srv.priceReguler)}
                      </p>
                    </div>
                    <div className="border-x border-slate-200">
                      <p className="text-[11px] text-slate-500">Express</p>
                      <p className="text-xs font-mono font-bold text-[#0B3FA8] tabular-nums mt-0.5">
                        {srv.model === 'self-service' ? '—' : formatRupiah(srv.priceExpress)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Premium</p>
                      <p className="text-xs font-mono font-bold text-[#1D4ED8] tabular-nums mt-0.5">
                        {srv.model === 'self-service' ? '—' : formatRupiah(srv.pricePremium)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      to={`/pesan?service=${srv.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white text-xs font-bold px-4 py-2.5 transition-colors"
                    >
                      Pesan Sekarang
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    <Link
                      to={`/kalkulator?service=${srv.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2.5 transition-colors"
                    >
                      Hitung
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
