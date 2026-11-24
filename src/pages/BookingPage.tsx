import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  MapPin,
  Printer,
  QrCode,
  Tag,
  Truck,
  Wallet,
  WashingMachine,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useLaundry } from '../context/LaundryContext';
import { calculateEstimate, formatRupiah, formatWIB } from '../utils/laundryRules';
import type { Order, PaymentMethod, ServiceModel, SpeedTier } from '../types/laundry';
import { QrCodeSvg } from '../components/QrCodeSvg';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';

const STEPS = [
  { num: 1, label: 'Layanan' },
  { num: 2, label: 'Jadwal & Alamat' },
  { num: 3, label: 'Tambahan & Promo' },
  { num: 4, label: 'Pembayaran' },
];

export const BookingPage: React.FC = () => {
  const { state, createOrder } = useLaundry();
  const [searchParams] = useSearchParams();
  const activeServices = state.services.filter((s) => s.active);
  const loggedCustomer = state.customers.find((c) => c.id === state.activeCustomerId);

  const paramMode = searchParams.get('mode') as ServiceModel | null;
  const paramService = searchParams.get('service');
  const paramMachine = searchParams.get('machine');
  const paramQty = Number(searchParams.get('qty'));
  const paramSpeed = searchParams.get('speed') as SpeedTier | null;
  const paramPromo = searchParams.get('promo') ?? '';
  const paramPickup = searchParams.get('pickup');

  const initialService =
    activeServices.find((s) => s.id === paramService) ??
    (paramMode === 'self-service'
      ? activeServices.find((s) => s.model === 'self-service')
      : activeServices[0]) ??
    activeServices[0];

  const [step, setStep] = useState(1);
  const [model, setModel] = useState<ServiceModel>(paramMode ?? initialService?.model ?? 'full-service');
  const [serviceId, setServiceId] = useState(initialService?.id ?? '');
  const [quantity, setQuantity] = useState(Number.isFinite(paramQty) && paramQty > 0 ? paramQty : 4);
  const [speed, setSpeed] = useState<SpeedTier>(
    paramSpeed && ['Reguler', 'Express', 'Premium'].includes(paramSpeed) ? paramSpeed : 'Reguler'
  );
  const [selectedMachineId, setSelectedMachineId] = useState(paramMachine ?? '');

  // Step 2
  const [customerName, setCustomerName] = useState(loggedCustomer?.name ?? '');
  const [customerPhone, setCustomerPhone] = useState(loggedCustomer?.phone ?? '');
  const [pickupDelivery, setPickupDelivery] = useState(
    paramPickup === '0' ? false : model !== 'self-service'
  );
  const [addressText, setAddressText] = useState(
    loggedCustomer?.addresses.find((a) => a.isDefault)?.street ?? ''
  );
  const [pickupDate, setPickupDate] = useState('2026-11-23');
  const [pickupSlot, setPickupSlot] = useState('13:00 – 15:00 WIB');
  const [notes, setNotes] = useState('');

  // Step 3
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState(paramPromo);

  // Step 4
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [eWalletBrand, setEWalletBrand] = useState('GoPay');
  const [vaBank, setVaBank] = useState('BCA Virtual Account');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Confirmation
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const modelFilteredServices = useMemo(() => {
    if (model === 'self-service') {
      return activeServices.filter((s) => s.model === 'self-service');
    }
    if (model === 'hybrid') {
      return activeServices.filter((s) => s.model === 'hybrid' || s.category === 'satuan' || s.category === 'kiloan');
    }
    return activeServices.filter((s) => s.model !== 'self-service');
  }, [activeServices, model]);

  const selectedService =
    activeServices.find((s) => s.id === serviceId) ?? modelFilteredServices[0] ?? activeServices[0];

  const availableMachines = state.machines.filter((m) => m.status === 'Tersedia');

  const selectedAddons = useMemo(
    () => state.addons.filter((a) => selectedAddonIds.includes(a.id)),
    [state.addons, selectedAddonIds]
  );

  const isFirstOrder = !loggedCustomer || loggedCustomer.totalOrders === 0;

  const estimate = useMemo(() => {
    if (!selectedService) return null;
    return calculateEstimate(
      {
        service: selectedService,
        quantity,
        speed: model === 'self-service' ? 'Reguler' : speed,
        addons: selectedAddons,
        pickupDelivery: model === 'self-service' ? false : pickupDelivery,
        promoCode,
        isFirstOrder,
      },
      state.promos,
      state.settings.pricing
    );
  }, [
    selectedService,
    quantity,
    model,
    speed,
    selectedAddons,
    pickupDelivery,
    promoCode,
    isFirstOrder,
    state.promos,
    state.settings.pricing,
  ]);

  const handleModelChange = (nextModel: ServiceModel) => {
    setModel(nextModel);
    if (nextModel === 'self-service') {
      const ss = activeServices.find((s) => s.model === 'self-service');
      if (ss) setServiceId(ss.id);
      setPickupDelivery(false);
      setQuantity(1);
    } else if (nextModel === 'hybrid') {
      const hy = activeServices.find((s) => s.model === 'hybrid') ?? activeServices[0];
      if (hy) setServiceId(hy.id);
      setPickupDelivery(false);
    } else {
      const fs = activeServices.find((s) => s.model === 'full-service') ?? activeServices[0];
      if (fs) setServiceId(fs.id);
      setPickupDelivery(true);
    }
  };

  const validateAndNext = () => {
    setFormError('');
    if (step === 1) {
      if (!selectedService) {
        setFormError('Pilih minimal satu layanan.');
        return;
      }
      if (quantity < 1) {
        setFormError('Jumlah atau berat minimal 1.');
        return;
      }
    }
    if (step === 2) {
      if (!customerName.trim()) {
        setFormError('Nama lengkap wajib diisi.');
        return;
      }
      if (customerPhone.replace(/\D/g, '').length < 9) {
        setFormError('Masukkan nomor WhatsApp/HP Indonesia yang valid.');
        return;
      }
      if (pickupDelivery && model !== 'self-service' && addressText.trim().length < 8) {
        setFormError('Masukkan alamat penjemputan secara lengkap.');
        return;
      }
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !estimate) return;
    setSubmitting(true);
    setFormError('');
    try {
      const addonLines = selectedAddons.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.perUnit ? a.price * quantity : a.price,
      }));
      const isPayLater = paymentMethod === 'COD';
      const order = await createOrder({
        customerId: loggedCustomer?.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        model,
        speed: model === 'self-service' ? 'Reguler' : speed,
        items: [
          {
            id: `oi-${Date.now()}`,
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            unit: selectedService.unit,
            quantity,
            unitPrice: estimate.unitPrice,
            subtotal: estimate.serviceSubtotal,
          },
        ],
        addons: addonLines,
        subtotal: estimate.subtotal,
        promoCode: estimate.promoResult?.valid ? promoCode.trim().toUpperCase() : undefined,
        discount: estimate.discount,
        deliveryFee: estimate.deliveryFee,
        total: estimate.total,
        paidAmount: isPayLater ? 0 : estimate.total,
        paymentMethod,
        paymentStatus: isPayLater ? 'Menunggu' : 'Lunas',
        pickupDelivery: model !== 'self-service' && pickupDelivery,
        addressText: pickupDelivery ? addressText.trim() : 'Drop-off / Datang ke Outlet Kemang',
        pickupSchedule: `${pickupDate}, ${pickupSlot}`,
        notes: notes.trim() || undefined,
        machineId: model === 'self-service' && selectedMachineId ? selectedMachineId : undefined,
      });
      setConfirmedOrder(order);
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="bg-[#F4F8FF] min-h-[80vh] py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-white border border-emerald-200 shadow-lg p-6 sm:p-8 text-center space-y-6">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </span>

            <div>
              <p className="text-xs font-bold tracking-wider text-emerald-700">PESANAN BERHASIL DIBUAT</p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#082B78]">
                Terima Kasih, {confirmedOrder.customerName}!
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Notifikasi konfirmasi telah dikirim ke WhatsApp{' '}
                <strong className="text-slate-900">{confirmedOrder.customerPhone}</strong>.
              </p>
            </div>

            <div className="rounded-xl bg-[#F4F8FF] border border-blue-200 p-5 space-y-3 text-left text-sm">
              <div className="flex items-center justify-between border-b border-blue-200/70 pb-3">
                <span className="text-slate-600">Nomor Nota / Order</span>
                <span
                  data-testid="confirmed-order-number"
                  className="font-mono text-base font-extrabold text-[#0B3FA8]"
                >
                  {confirmedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Layanan</span>
                <span className="font-semibold text-slate-900">
                  {confirmedOrder.items[0]?.serviceName} ({confirmedOrder.items[0]?.quantity}{' '}
                  {confirmedOrder.items[0]?.unit})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Metode Pembayaran</span>
                <span className="font-semibold text-slate-900">
                  {confirmedOrder.paymentMethod} ({confirmedOrder.paymentStatus})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Estimasi Selesai</span>
                <span className="font-semibold text-slate-900">
                  {formatWIB(confirmedOrder.estimatedFinishAt)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200/70">
                <span className="font-bold text-slate-900">Total Tagihan</span>
                <span className="font-mono text-lg font-extrabold text-[#0B3FA8] tabular-nums">
                  {formatRupiah(confirmedOrder.total)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to={`/lacak?q=${confirmedOrder.orderNumber}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white px-5 py-3 text-sm font-bold transition-colors"
              >
                Lacak Status Cucian
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => setShowReceipt(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-5 py-3 text-sm font-semibold transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Lihat Nota Digital
              </button>
            </div>
          </div>
        </div>

        <ThermalReceiptModal
          order={showReceipt ? confirmedOrder : null}
          onClose={() => setShowReceipt(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-[#F4F8FF] min-h-[80vh] py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#1D4ED8]">PEMESANAN ONLINE</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#082B78]">
            Pesan Antar-Jemput atau Booking Mesin Self-Service
          </h1>
        </div>

        {/* 4-Step Wizard Progress */}
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STEPS.map((s) => {
            const active = step === s.num;
            const done = step > s.num;
            return (
              <li
                key={s.num}
                className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors ${
                  active
                    ? 'border-[#1D4ED8] bg-[#0B3FA8] text-white shadow-xs'
                    : done
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active
                      ? 'bg-[#FACC15] text-[#082B78]'
                      : done
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {s.num}
                </span>
                <span className="text-xs font-bold truncate">{s.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Wizard Main Card */}
          <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            {formError && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-800 flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            {/* STEP 1: LAYANAN */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-[#082B78]">
                    Pilih Model Layanan
                  </h2>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        {
                          key: 'full-service' as ServiceModel,
                          title: 'Full-Service',
                          desc: 'Jemput/antar, dicuci & disetrika staff',
                        },
                        {
                          key: 'self-service' as ServiceModel,
                          title: 'Self-Service',
                          desc: 'Booking mesin cuci/pengering mandiri',
                        },
                        {
                          key: 'hybrid' as ServiceModel,
                          title: 'Hybrid',
                          desc: 'Cuci sendiri lalu titip setrika/lipat',
                        },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => handleModelChange(m.key)}
                        className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                          model === m.key
                            ? 'border-[#1D4ED8] bg-blue-50 ring-2 ring-blue-100'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <p className="text-sm font-bold text-[#082B78]">{m.title}</p>
                        <p className="text-xs text-slate-600 mt-1">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="book-service" className="block text-sm font-bold text-slate-900 mb-2">
                    Pilih Paket Layanan
                  </label>
                  <select
                    id="book-service"
                    value={selectedService?.id ?? ''}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-[#1D4ED8] focus:outline-none"
                  >
                    {modelFilteredServices.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} — {formatRupiah(srv.priceReguler)}/{srv.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="book-qty" className="block text-sm font-bold text-slate-900 mb-2">
                      Perkiraan Jumlah ({selectedService?.unit})
                    </label>
                    <input
                      id="book-qty"
                      type="number"
                      min={1}
                      max={50}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono font-bold"
                    />
                  </div>

                  {model !== 'self-service' && (
                    <div>
                      <label htmlFor="book-speed" className="block text-sm font-bold text-slate-900 mb-2">
                        Kecepatan Pengerjaan
                      </label>
                      <select
                        id="book-speed"
                        value={speed}
                        onChange={(e) => setSpeed(e.target.value as SpeedTier)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium"
                      >
                        <option value="Reguler">Reguler (3 Hari · Normal)</option>
                        <option value="Express">
                          Express (24 Jam · +{state.settings.pricing.expressMarkupPct}%)
                        </option>
                        <option value="Premium">
                          Premium (Hari Sama · +{state.settings.pricing.premiumMarkupPct}%)
                        </option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Optional Self-Service Machine Booking */}
                {model === 'self-service' && (
                  <div className="space-y-2.5">
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <WashingMachine className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
                      Pilih Mesin Tersedia untuk Dibooking (Opsional)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableMachines.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setSelectedMachineId(selectedMachineId === m.id ? '' : m.id)
                          }
                          className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                            selectedMachineId === m.id
                              ? 'border-[#1D4ED8] bg-blue-50 ring-2 ring-blue-100'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <p className="text-xs font-mono text-slate-500">
                            {m.code} · {m.capacityKg} kg · {m.durationMinutes} mnt
                          </p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{m.name}</p>
                          <p className="text-xs font-mono font-bold text-[#0B3FA8] mt-1">
                            {formatRupiah(m.pricePerCycle)}/siklus
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: JADWAL & ALAMAT */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-extrabold text-[#082B78]">
                  Data Pelanggan, Jadwal &amp; Alamat
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="book-name" className="block text-sm font-bold text-slate-900 mb-1.5">
                      Nama Lengkap *
                    </label>
                    <input
                      id="book-name"
                      type="text"
                      placeholder="Contoh: Rina Kusuma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="book-phone" className="block text-sm font-bold text-slate-900 mb-1.5">
                      Nomor WhatsApp (+62) *
                    </label>
                    <input
                      id="book-phone"
                      type="tel"
                      placeholder="+6281234567890"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>
                </div>

                {model !== 'self-service' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setPickupDelivery(true)}
                      className={`flex-1 min-w-[180px] rounded-xl border p-3.5 text-left cursor-pointer ${
                        pickupDelivery
                          ? 'border-[#1D4ED8] bg-blue-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-bold text-[#082B78] inline-flex items-center gap-1.5">
                        <Truck className="h-4 w-4" aria-hidden="true" />
                        Jemput &amp; Antar Kurir
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Gratis mulai {formatRupiah(state.settings.pricing.freePickupMinOrder)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickupDelivery(false)}
                      className={`flex-1 min-w-[180px] rounded-xl border p-3.5 text-left cursor-pointer ${
                        !pickupDelivery
                          ? 'border-[#1D4ED8] bg-blue-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-bold text-[#082B78] inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        Antar Sendiri ke Outlet
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">Outlet Kemang / Bintaro</p>
                    </button>
                  </div>
                )}

                {pickupDelivery && model !== 'self-service' && (
                  <div>
                    <label htmlFor="book-address" className="block text-sm font-bold text-slate-900 mb-1.5">
                      Alamat Penjemputan Lengkap *
                    </label>
                    <textarea
                      id="book-address"
                      rows={3}
                      placeholder="Jl. Kemang Timur No. 19A, Jakarta Selatan (patokan rumah / apartemen)"
                      value={addressText}
                      onChange={(e) => setAddressText(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="book-date" className="block text-sm font-bold text-slate-900 mb-1.5">
                      Tanggal {pickupDelivery ? 'Penjemputan' : 'Kunjungan'}
                    </label>
                    <input
                      id="book-date"
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="book-slot" className="block text-sm font-bold text-slate-900 mb-1.5">
                      Slot Waktu (WIB)
                    </label>
                    <select
                      id="book-slot"
                      value={pickupSlot}
                      onChange={(e) => setPickupSlot(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                    >
                      <option value="08:00 – 10:00 WIB">08:00 – 10:00 WIB</option>
                      <option value="10:00 – 13:00 WIB">10:00 – 13:00 WIB</option>
                      <option value="13:00 – 15:00 WIB">13:00 – 15:00 WIB</option>
                      <option value="15:00 – 18:00 WIB">15:00 – 18:00 WIB</option>
                      <option value="18:00 – 21:00 WIB">18:00 – 21:00 WIB</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="book-notes" className="block text-sm font-bold text-slate-900 mb-1.5">
                    Catatan Khusus (Opsional)
                  </label>
                  <input
                    id="book-notes"
                    type="text"
                    placeholder="Contoh: Pisahkan pakaian putih, jangan pakai pewangi menyengat"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: TAMBAHAN & PROMO */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-extrabold text-[#082B78]">
                  Layanan Tambahan &amp; Kode Promo
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {state.addons.map((addon) => {
                    const checked = selectedAddonIds.includes(addon.id);
                    return (
                      <label
                        key={addon.id}
                        className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer ${
                          checked ? 'border-[#1D4ED8] bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedAddonIds((prev) =>
                              prev.includes(addon.id)
                                ? prev.filter((id) => id !== addon.id)
                                : [...prev, addon.id]
                            )
                          }
                          className="mt-1 h-4 w-4 accent-[#1D4ED8]"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{addon.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{addon.description}</p>
                          <p className="text-xs font-mono font-bold text-[#0B3FA8] mt-1">
                            +{formatRupiah(addon.price)}
                            {addon.perUnit ? `/${selectedService?.unit}` : '/order'}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-[#F4F8FF] border border-blue-200 p-4 space-y-2.5">
                  <label htmlFor="book-promo" className="block text-sm font-bold text-[#082B78]">
                    Punya Kode Promo?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Tag className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                      <input
                        id="book-promo"
                        type="text"
                        placeholder="Masukkan kode (mis. WELCOME20)"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm font-mono uppercase focus:border-[#1D4ED8] focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPromoCode('WELCOME20')}
                      className="rounded-xl border border-blue-300 bg-white px-3.5 py-2 text-xs font-bold text-[#0B3FA8] hover:bg-blue-50 cursor-pointer"
                    >
                      Pakai WELCOME20
                    </button>
                  </div>
                  {promoCode.trim() && estimate?.promoResult && (
                    <p
                      className={`text-xs font-semibold ${
                        estimate.promoResult.valid ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {estimate.promoResult.valid
                        ? `Berhasil! Diskon ${formatRupiah(estimate.discount)} diterapkan.`
                        : estimate.promoResult.reason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: PEMBAYARAN */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-lg font-extrabold text-[#082B78]">
                  Pilih Metode Pembayaran
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      { method: 'QRIS' as PaymentMethod, icon: QrCode, desc: 'Midtrans · Semua e-wallet & m-Banking' },
                      { method: 'E-Wallet' as PaymentMethod, icon: Wallet, desc: 'GoPay, OVO, DANA, ShopeePay' },
                      { method: 'Virtual Account' as PaymentMethod, icon: Building2, desc: 'Xendit VA BCA, Mandiri, BNI, BRI' },
                      { method: 'COD' as PaymentMethod, icon: CreditCard, desc: 'Bayar di Kasir / Saat Kurir Tiba' },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = paymentMethod === item.method;
                    return (
                      <button
                        key={item.method}
                        type="button"
                        onClick={() => setPaymentMethod(item.method)}
                        className={`rounded-xl border p-4 text-left flex items-start gap-3 transition-all cursor-pointer ${
                          active
                            ? 'border-[#1D4ED8] bg-blue-50 ring-2 ring-blue-100'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <Icon className="h-5 w-5 text-[#1D4ED8] shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {item.method === 'COD' ? 'COD / Bayar di Kasir' : item.method}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Contextual simulated payment instruction */}
                {paymentMethod === 'QRIS' && estimate && (
                  <div className="rounded-xl border border-blue-200 bg-[#F4F8FF] p-5 flex flex-col sm:flex-row items-center gap-5">
                    <QrCodeSvg value={`ELAUNDRY-QRIS-${estimate.total}`} size={120} label="QRIS E-Laundry" />
                    <div className="space-y-1.5 text-sm">
                      <p className="font-bold text-[#082B78]">Simulasi QRIS Midtrans Sandbox</p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Total tagihan <strong className="font-mono">{formatRupiah(estimate.total)}</strong>.
                        Klik tombol Konfirmasi &amp; Bayar di bawah untuk mensimulasikan pembayaran QRIS instan.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'E-Wallet' && (
                  <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                    <label htmlFor="ewallet-select" className="text-xs font-bold text-slate-700 block">
                      Pilih Penyedia E-Wallet
                    </label>
                    <select
                      id="ewallet-select"
                      value={eWalletBrand}
                      onChange={(e) => setEWalletBrand(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option>GoPay</option>
                      <option>OVO</option>
                      <option>DANA</option>
                      <option>ShopeePay</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'Virtual Account' && (
                  <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                    <label htmlFor="va-select" className="text-xs font-bold text-slate-700 block">
                      Pilih Bank Virtual Account (Xendit)
                    </label>
                    <select
                      id="va-select"
                      value={vaBank}
                      onChange={(e) => setVaBank(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option>BCA Virtual Account</option>
                      <option>Mandiri Virtual Account</option>
                      <option>BNI Virtual Account</option>
                      <option>BRI Virtual Account</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setFormError('');
                    setStep((s) => s - 1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Kembali
                </button>
              ) : (
                <Link
                  to="/layanan"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  ← Lihat Katalog Layanan
                </Link>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={validateAndNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white px-6 py-2.5 text-sm font-bold transition-colors cursor-pointer"
                >
                  Lanjut
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmBooking}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-sm font-extrabold transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting
                    ? 'Memproses Pesanan...'
                    : paymentMethod === 'COD'
                    ? 'Konfirmasi Pesanan (Bayar Nanti)'
                    : `Konfirmasi & Bayar ${estimate ? formatRupiah(estimate.total) : ''}`}
                </button>
              )}
            </div>
          </div>

          {/* Live Order Summary Sidebar */}
          {estimate && selectedService && (
            <aside className="lg:col-span-4 rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4 lg:sticky lg:top-24">
              <h3 className="text-sm font-extrabold text-[#082B78] border-b border-slate-100 pb-3">
                Ringkasan Pesanan
              </h3>
              <div className="space-y-2.5 text-xs tabular-nums">
                <div className="flex justify-between">
                  <span className="text-slate-500">Model</span>
                  <span className="font-semibold text-slate-900 capitalize">{model}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Layanan</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {selectedService.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Jumlah ({quantity} {selectedService.unit} × {formatRupiah(estimate.unitPrice)})
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatRupiah(estimate.serviceSubtotal)}
                  </span>
                </div>
                {estimate.addonsTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tambahan ({selectedAddons.length})</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatRupiah(estimate.addonsTotal)}
                    </span>
                  </div>
                )}
                {pickupDelivery && model !== 'self-service' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jemput &amp; Antar</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {estimate.deliveryFee === 0 ? 'GRATIS' : formatRupiah(estimate.deliveryFee)}
                    </span>
                  </div>
                )}
                {estimate.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Diskon ({promoCode.trim().toUpperCase()})</span>
                    <span className="font-mono font-bold">-{formatRupiah(estimate.discount)}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-700">Total Tagihan</span>
                <span className="text-xl font-extrabold font-mono text-[#0B3FA8] tabular-nums">
                  {formatRupiah(estimate.total)}
                </span>
              </div>
              {customerName && (
                <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">{customerName}</p>
                  <p className="font-mono">{customerPhone}</p>
                  <p>{pickupDate} · {pickupSlot}</p>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
