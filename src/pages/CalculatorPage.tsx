import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Calculator, CheckCircle2, Tag, Truck, AlertCircle } from 'lucide-react';
import { useLaundry } from '../context/LaundryContext';
import { calculateEstimate, formatRupiah } from '../utils/laundryRules';
import type { SpeedTier } from '../types/laundry';

export const CalculatorPage: React.FC = () => {
  const { state } = useLaundry();
  const [searchParams] = useSearchParams();
  const activeServices = state.services.filter((s) => s.active);

  const initialServiceId =
    searchParams.get('service') && activeServices.some((s) => s.id === searchParams.get('service'))
      ? searchParams.get('service')!
      : activeServices[0]?.id ?? '';

  const [serviceId, setServiceId] = useState(initialServiceId);
  const [quantity, setQuantity] = useState(5);
  const [speed, setSpeed] = useState<SpeedTier>('Reguler');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [pickupDelivery, setPickupDelivery] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [isFirstOrder, setIsFirstOrder] = useState(true);

  const selectedService =
    activeServices.find((s) => s.id === serviceId) ?? activeServices[0];

  const selectedAddons = useMemo(
    () => state.addons.filter((a) => selectedAddonIds.includes(a.id)),
    [state.addons, selectedAddonIds]
  );

  const estimate = useMemo(() => {
    if (!selectedService) return null;
    return calculateEstimate(
      {
        service: selectedService,
        quantity,
        speed,
        addons: selectedAddons,
        pickupDelivery,
        promoCode,
        isFirstOrder,
      },
      state.promos,
      state.settings.pricing
    );
  }, [
    selectedService,
    quantity,
    speed,
    selectedAddons,
    pickupDelivery,
    promoCode,
    isFirstOrder,
    state.promos,
    state.settings.pricing,
  ]);

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (!selectedService || !estimate) return null;

  const bookingUrl = `/pesan?service=${selectedService.id}&qty=${quantity}&speed=${speed}&promo=${encodeURIComponent(
    promoCode.trim().toUpperCase()
  )}&pickup=${pickupDelivery ? '1' : '0'}`;

  return (
    <div className="bg-[#F4F8FF] min-h-[80vh] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#1D4ED8]">ESTIMASI BIAYA REAL-TIME</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold text-[#082B78]">
            Kalkulator Tarif E-Laundry
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
            Hitung perkiraan biaya laundry kiloan, satuan, maupun self-service lengkap dengan opsi
            kecepatan, layanan tambahan, dan kode promo sebelum memesan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Inputs */}
          <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            {/* 1. Pilih Layanan */}
            <div>
              <label htmlFor="calc-service" className="block text-sm font-bold text-slate-900 mb-2">
                1. Pilih Jenis Layanan
              </label>
              <select
                id="calc-service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {activeServices.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} — {formatRupiah(srv.priceReguler)}/{srv.unit} (
                    {srv.model === 'self-service'
                      ? 'Self-Service'
                      : srv.model === 'hybrid'
                      ? 'Hybrid'
                      : 'Full-Service'}
                    )
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Berat / Jumlah */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="calc-qty" className="text-sm font-bold text-slate-900">
                  2. Perkiraan Jumlah ({selectedService.unit})
                </label>
                <span className="font-mono text-sm font-bold text-[#0B3FA8] tabular-nums">
                  {quantity} {selectedService.unit}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  id="calc-qty"
                  type="range"
                  min={1}
                  max={25}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="flex-1 accent-[#1D4ED8]"
                />
                <input
                  type="number"
                  aria-label="Input jumlah manual"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-center font-mono text-sm font-bold tabular-nums"
                />
              </div>
            </div>

            {/* 3. Kecepatan Pengerjaan */}
            {selectedService.model !== 'self-service' && (
              <div>
                <p className="text-sm font-bold text-slate-900 mb-2">3. Kecepatan Pengerjaan</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    [
                      { tier: 'Reguler' as SpeedTier, note: '3 Hari · Tarif Normal' },
                      {
                        tier: 'Express' as SpeedTier,
                        note: `24 Jam · +${state.settings.pricing.expressMarkupPct}%`,
                      },
                      {
                        tier: 'Premium' as SpeedTier,
                        note: `Hari Sama · +${state.settings.pricing.premiumMarkupPct}%`,
                      },
                    ] as const
                  ).map((opt) => {
                    const active = speed === opt.tier;
                    return (
                      <button
                        key={opt.tier}
                        type="button"
                        onClick={() => setSpeed(opt.tier)}
                        className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                          active
                            ? 'border-[#1D4ED8] bg-blue-50 ring-2 ring-blue-100'
                            : 'border-slate-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <p className="text-sm font-bold text-[#082B78]">{opt.tier}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{opt.note}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Layanan Tambahan */}
            <div>
              <p className="text-sm font-bold text-slate-900 mb-2">4. Layanan Tambahan (Opsional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {state.addons.map((addon) => {
                  const checked = selectedAddonIds.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                        checked
                          ? 'border-[#1D4ED8] bg-blue-50/70'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAddon(addon.id)}
                        className="mt-1 h-4 w-4 rounded accent-[#1D4ED8]"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900">{addon.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{addon.description}</p>
                        <p className="text-xs font-mono font-semibold text-[#0B3FA8] mt-1 tabular-nums">
                          +{formatRupiah(addon.price)}
                          {addon.perUnit ? ` / ${selectedService.unit}` : ' / order'}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 5. Antar-Jemput & Promo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {selectedService.model !== 'self-service' && (
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pickupDelivery}
                    onChange={(e) => setPickupDelivery(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#1D4ED8]"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden="true" />
                      Gunakan Antar-Jemput Kurir
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Gratis mulai {formatRupiah(state.settings.pricing.freePickupMinOrder)} (flat{' '}
                      {formatRupiah(state.settings.pricing.standardDeliveryFee)} di bawahnya).
                    </p>
                  </div>
                </label>
              )}

              <div className="space-y-1.5">
                <label htmlFor="calc-promo" className="block text-xs font-bold text-slate-900">
                  Kode Promo (coba: WELCOME20 / HEMAT15K)
                </label>
                <div className="relative">
                  <Tag className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="calc-promo"
                    type="text"
                    placeholder="Contoh: WELCOME20"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm font-mono uppercase focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isFirstOrder}
                    onChange={(e) => setIsFirstOrder(e.target.checked)}
                    className="accent-[#1D4ED8]"
                  />
                  Simulasikan sebagai pelanggan pesanan pertama
                </label>
              </div>
            </div>
          </div>

          {/* Live Breakdown Summary */}
          <aside className="lg:col-span-5 rounded-2xl bg-[#082B78] text-white p-6 sm:p-7 shadow-xl shadow-blue-900/15 space-y-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-2.5 border-b border-blue-800 pb-4">
              <Calculator className="h-5 w-5 text-[#FACC15]" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-extrabold">Rincian Estimasi Biaya</h2>
                <p className="text-xs text-blue-200">
                  Estimasi pengerjaan:{' '}
                  {estimate.estimatedHours <= 1 ? '40–45 menit' : `${estimate.estimatedHours} jam`}
                </p>
              </div>
            </div>

            <dl className="space-y-3 text-sm tabular-nums">
              <div className="flex justify-between gap-2">
                <dt className="text-blue-200">
                  {selectedService.name} ({quantity} {selectedService.unit} ×{' '}
                  {formatRupiah(estimate.unitPrice)})
                </dt>
                <dd className="font-mono font-semibold">{formatRupiah(estimate.serviceSubtotal)}</dd>
              </div>

              {estimate.addonsTotal > 0 && (
                <div className="flex justify-between gap-2">
                  <dt className="text-blue-200">Layanan Tambahan ({selectedAddons.length})</dt>
                  <dd className="font-mono font-semibold">{formatRupiah(estimate.addonsTotal)}</dd>
                </div>
              )}

              {selectedService.model !== 'self-service' && pickupDelivery && (
                <div className="flex justify-between gap-2">
                  <dt className="text-blue-200">Biaya Antar-Jemput</dt>
                  <dd className="font-mono font-semibold text-emerald-300">
                    {estimate.deliveryFee === 0 ? 'GRATIS' : formatRupiah(estimate.deliveryFee)}
                  </dd>
                </div>
              )}

              {estimate.discount > 0 && (
                <div className="flex justify-between gap-2 text-[#FACC15]">
                  <dt>Diskon Promo ({promoCode.trim().toUpperCase()})</dt>
                  <dd className="font-mono font-bold">-{formatRupiah(estimate.discount)}</dd>
                </div>
              )}
            </dl>

            {promoCode.trim() && estimate.promoResult && (
              <div
                className={`rounded-xl px-3.5 py-2.5 text-xs flex items-start gap-2 ${
                  estimate.promoResult.valid
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-200 border border-rose-400/30'
                }`}
              >
                {estimate.promoResult.valid ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span>
                  {estimate.promoResult.valid
                    ? `Promo ${estimate.promoResult.promo?.code} aktif! Hemat ${formatRupiah(
                        estimate.discount
                      )}.`
                    : estimate.promoResult.reason}
                </span>
              </div>
            )}

            <div className="border-t border-blue-800 pt-4 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-blue-200">Total Estimasi</span>
              <span
                data-testid="calculator-total"
                className="text-3xl font-extrabold font-mono text-[#FACC15] tabular-nums"
              >
                {formatRupiah(estimate.total)}
              </span>
            </div>

            <Link
              to={bookingUrl}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FACC15] hover:bg-yellow-300 text-[#082B78] px-5 py-3.5 text-sm font-extrabold transition-colors"
            >
              Lanjut ke Pemesanan
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
};
