import React, { useMemo, useState } from 'react';
import {
  ShoppingBag,
  KanbanSquare,
  WashingMachine,
  Truck,
  Calculator,
  Printer,
  ArrowRight,
  ArrowLeft,
  Plus,
  Coins,
  StopCircle,
  CheckCircle2,
  UserPlus,
  MessageCircle,
} from 'lucide-react';
import { useLaundry } from '../context/LaundryContext';
import {
  QUEUE_STATUS_FLOW,
  calculateEstimate,
  computeFinancialSummary,
  formatCountdown,
  formatRupiah,
  formatWIB,
  getNextQueueStatus,
} from '../utils/laundryRules';
import type {
  Order,
  PaymentMethod,
  PaymentStatus,
  QueueStatus,
  ServiceModel,
  SpeedTier,
} from '../types/laundry';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';

type PosTab = 'transaksi' | 'kanban' | 'mesin' | 'kurir' | 'shift';

export const PosPage: React.FC = () => {
  const {
    state,
    createOrder,
    updateOrderQueueStatus,
    settleOrderPayment,
    assignCourierToOrder,
    sellTokenAndActivateMachine,
    stopMachineSession,
    upsertCustomer,
    closeCurrentShift,
  } = useLaundry();

  const [activeTab, setActiveTab] = useState<PosTab>('transaksi');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Quick POS Transaction State
  const [posMode, setPosMode] = useState<'kiloan' | 'satuan' | 'self-service' | 'kombinasi'>('kiloan');
  const [selectedCustomerId, setSelectedCustomerId] = useState(state.customers[0]?.id ?? '');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const activeServices = state.services.filter((s) => s.active);
  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? '');
  const [weightOrQty, setWeightOrQty] = useState(4.5);
  const [speed, setSpeed] = useState<SpeedTier>('Reguler');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Lunas');
  const [dpAmount, setDpAmount] = useState(20000);
  const [pickupDelivery, setPickupDelivery] = useState(false);
  const [notes, setNotes] = useState('');

  // Machine Activation Quick State
  const [tokenCustomerName, setTokenCustomerName] = useState('Walk-in Pelanggan');
  const [tokenPaySource, setTokenPaySource] = useState<'Token' | 'QRIS'>('Token');

  // Drag & Drop State for Kanban
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return state.customers;
    return state.customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [state.customers, customerSearch]);

  const modeServices = useMemo(() => {
    if (posMode === 'kiloan') {
      return activeServices.filter((s) => s.unit === 'kg');
    }
    if (posMode === 'satuan') {
      return activeServices.filter((s) => s.unit === 'item' || s.unit === 'pasang');
    }
    if (posMode === 'self-service') {
      return activeServices.filter((s) => s.model === 'self-service');
    }
    return activeServices;
  }, [activeServices, posMode]);

  const currentService =
    modeServices.find((s) => s.id === serviceId) ?? modeServices[0] ?? activeServices[0];

  const selectedCustomer =
    state.customers.find((c) => c.id === selectedCustomerId) ?? state.customers[0];

  const selectedAddons = useMemo(
    () => state.addons.filter((a) => selectedAddonIds.includes(a.id)),
    [state.addons, selectedAddonIds]
  );

  const posEstimate = useMemo(() => {
    if (!currentService) return null;
    return calculateEstimate(
      {
        service: currentService,
        quantity: weightOrQty,
        speed: posMode === 'self-service' ? 'Reguler' : speed,
        addons: selectedAddons,
        pickupDelivery,
        promoCode,
        isFirstOrder: (selectedCustomer?.totalOrders ?? 0) === 0,
      },
      state.promos,
      state.settings.pricing
    );
  }, [
    currentService,
    weightOrQty,
    posMode,
    speed,
    selectedAddons,
    pickupDelivery,
    promoCode,
    selectedCustomer,
    state.promos,
    state.settings.pricing,
  ]);

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    const created = upsertCustomer({ name: newCustName.trim(), phone: newCustPhone.trim() });
    setSelectedCustomerId(created.id);
    setNewCustName('');
    setNewCustPhone('');
    setShowQuickAddCustomer(false);
  };

  const handleSubmitPosOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentService || !posEstimate || !selectedCustomer) return;

    const paidAmount =
      paymentStatus === 'Lunas'
        ? posEstimate.total
        : paymentStatus === 'DP'
        ? Math.min(posEstimate.total, Math.max(0, dpAmount))
        : 0;

    const model: ServiceModel =
      posMode === 'self-service'
        ? 'self-service'
        : posMode === 'kombinasi'
        ? 'hybrid'
        : currentService.model;

    const created = await createOrder({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      model,
      speed: model === 'self-service' ? 'Reguler' : speed,
      items: [
        {
          id: `oi-${Date.now()}`,
          serviceId: currentService.id,
          serviceName: currentService.name,
          unit: currentService.unit,
          quantity: weightOrQty,
          unitPrice: posEstimate.unitPrice,
          subtotal: posEstimate.serviceSubtotal,
        },
      ],
      addons: selectedAddons.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.perUnit ? Math.round(a.price * weightOrQty) : a.price,
      })),
      subtotal: posEstimate.subtotal,
      promoCode: posEstimate.promoResult?.valid ? promoCode.trim().toUpperCase() : undefined,
      discount: posEstimate.discount,
      deliveryFee: posEstimate.deliveryFee,
      total: posEstimate.total,
      paidAmount,
      paymentMethod,
      paymentStatus,
      pickupDelivery,
      addressText: selectedCustomer.addresses[0]?.street ?? 'Outlet Kemang',
      notes: notes.trim() || undefined,
      actorName: 'Dewi Lestari (Kasir POS)',
    });

    setNotes('');
    setPromoCode('');
    setReceiptOrder(created);
  };

  // Production queue orders (exclude pure self-service)
  const queueOrders = useMemo(
    () => state.orders.filter((o) => o.model !== 'self-service'),
    [state.orders]
  );

  const deliveryOrders = useMemo(
    () => state.orders.filter((o) => o.pickupDelivery),
    [state.orders]
  );

  const couriers = useMemo(
    () => state.employees.filter((e) => e.role === 'Kurir' && e.active),
    [state.employees]
  );

  const receivables = useMemo(
    () => state.orders.filter((o) => o.total > o.paidAmount),
    [state.orders]
  );

  const financial = useMemo(
    () => computeFinancialSummary(state.orders, state.expenses, state.payments),
    [state.orders, state.expenses, state.payments]
  );

  return (
    <div className="space-y-6">
      {/* POS Workspace Segmented Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
        <div role="tablist" aria-label="Menu Panel Kasir" className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'transaksi' as PosTab, label: 'Kasir Cepat', icon: ShoppingBag },
              { key: 'kanban' as PosTab, label: `Antrean Kanban (${queueOrders.filter((o) => o.queueStatus !== 'Selesai').length})`, icon: KanbanSquare },
              { key: 'mesin' as PosTab, label: 'Token & Mesin Self-Service', icon: WashingMachine },
              { key: 'kurir' as PosTab, label: 'Jemput & Antar Kurir', icon: Truck },
              { key: 'shift' as PosTab, label: 'Shift & Tutup Kasir', icon: Calculator },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#0B3FA8] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-4 px-3 text-xs tabular-nums">
          <span className="text-slate-500">
            Omzet Hari Ini:{' '}
            <strong className="font-mono text-[#0B3FA8]">{formatRupiah(financial.todayRevenue)}</strong>
          </span>
          <span className="text-slate-500">
            Piutang:{' '}
            <strong className="font-mono text-amber-700">{formatRupiah(financial.unpaidReceivables)}</strong>
          </span>
        </div>
      </div>

      {/* TAB 1: KASIR CEPAT */}
      {activeTab === 'transaksi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSubmitPosOrder}
            className="lg:col-span-8 rounded-2xl bg-white border border-slate-200 p-6 space-y-6 shadow-xs"
          >
            {/* Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h1 className="text-lg font-extrabold text-[#082B78]">Input Transaksi Kasir Baru</h1>
                <p className="text-xs text-slate-500">
                  Pilih jenis transaksi, timbang berat (kg), hitung otomatis, dan cetak struk 58mm.
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {(
                  [
                    ['kiloan', 'Kiloan'],
                    ['satuan', 'Satuan'],
                    ['self-service', 'Self-Service'],
                    ['kombinasi', 'Hybrid'],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPosMode(m)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      posMode === m ? 'bg-white text-[#0B3FA8] shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Picker + Quick Add */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="pos-customer" className="text-xs font-bold text-slate-800">
                  Pelanggan
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCustomer((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Tambah Pelanggan Cepat
                </button>
              </div>

              {showQuickAddCustomer && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder="Nama pelanggan baru"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="No. WA (+62...)"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCustomer}
                    className="rounded-lg bg-[#0B3FA8] text-white text-xs font-bold px-3 py-2 cursor-pointer"
                  >
                    Simpan Pelanggan
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="search"
                  aria-label="Cari pelanggan"
                  placeholder="Cari nama atau nomor HP..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-[#1D4ED8] focus:outline-none"
                />
                <select
                  id="pos-customer"
                  value={selectedCustomer?.id ?? ''}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold"
                >
                  {filteredCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) · {c.membership}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Service & Timbangan Digital */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="pos-service" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Layanan
                </label>
                <select
                  id="pos-service"
                  value={currentService?.id ?? ''}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
                >
                  {modeServices.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} — {formatRupiah(srv.priceReguler)}/{srv.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pos-weight" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Timbang ({currentService?.unit})
                </label>
                <input
                  id="pos-weight"
                  type="number"
                  step={currentService?.unit === 'kg' ? '0.5' : '1'}
                  min={0.5}
                  value={weightOrQty}
                  onChange={(e) => setWeightOrQty(Math.max(0.5, Number(e.target.value) || 1))}
                  className="w-full rounded-xl border-2 border-[#1D4ED8] bg-blue-50/40 px-3.5 py-2 text-base font-mono font-extrabold text-[#082B78] tabular-nums"
                />
              </div>
            </div>

            {/* Speed & Addons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {posMode !== 'self-service' && (
                <div>
                  <p className="text-xs font-bold text-slate-800 mb-1.5">Kecepatan</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Reguler', 'Express', 'Premium'] as SpeedTier[]).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setSpeed(tier)}
                        className={`rounded-lg border py-2 text-xs font-bold cursor-pointer ${
                          speed === tier
                            ? 'border-[#1D4ED8] bg-[#0B3FA8] text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="pos-promo" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Kode Promo / Diskon
                </label>
                <input
                  id="pos-promo"
                  type="text"
                  placeholder="WELCOME20 / HEMAT15K"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono uppercase"
                />
              </div>
            </div>

            {/* Addons checkboxes */}
            <div className="flex flex-wrap gap-2">
              {state.addons.map((addon) => {
                const checked = selectedAddonIds.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() =>
                      setSelectedAddonIds((prev) =>
                        prev.includes(addon.id)
                          ? prev.filter((id) => id !== addon.id)
                          : [...prev, addon.id]
                      )
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      checked
                        ? 'border-[#1D4ED8] bg-blue-50 text-[#0B3FA8]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {checked ? '✓ ' : '+ '}
                    {addon.name} ({formatRupiah(addon.price)})
                  </button>
                );
              })}
            </div>

            {/* Payment Method & DP / Lunas / Piutang */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label htmlFor="pos-pay-method" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Metode Bayar
                </label>
                <select
                  id="pos-pay-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Transfer">Transfer Bank</option>
                  <option value="E-Wallet">E-Wallet</option>
                  <option value="COD">COD</option>
                </select>
              </div>

              <div>
                <label htmlFor="pos-pay-status" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Status Pembayaran
                </label>
                <select
                  id="pos-pay-status"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                >
                  <option value="Lunas">Lunas</option>
                  <option value="DP">Bayar DP</option>
                  <option value="Piutang">Piutang (Bayar Nanti)</option>
                </select>
              </div>

              {paymentStatus === 'DP' ? (
                <div>
                  <label htmlFor="pos-dp" className="block text-xs font-bold text-slate-800 mb-1.5">
                    Nominal DP (Rp)
                  </label>
                  <input
                    id="pos-dp"
                    type="number"
                    min={0}
                    step={5000}
                    value={dpAmount}
                    onChange={(e) => setDpAmount(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              ) : (
                <div className="flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pickupDelivery}
                      onChange={(e) => setPickupDelivery(e.target.checked)}
                      className="h-4 w-4 accent-[#1D4ED8]"
                    />
                    Jadwalkan Antar Kurir
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Total Tagihan Otomatis</p>
                <p className="text-2xl font-extrabold font-mono text-[#0B3FA8] tabular-nums">
                  {posEstimate ? formatRupiah(posEstimate.total) : 'Rp 0'}
                </p>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white px-6 py-3 text-sm font-extrabold shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Simpan Order &amp; Cetak Nota
              </button>
            </div>
          </form>

          {/* Right Sidebar: Recent Orders + Quick Token Sale */}
          <div className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#082B78]">Transaksi Terbaru</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('kanban')}
                  className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                >
                  Buka Kanban →
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {state.orders.slice(0, 5).map((ord) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-[#0B3FA8] truncate">{ord.orderNumber}</p>
                      <p className="text-slate-700 font-semibold truncate">{ord.customerName}</p>
                      <p className="text-[11px] text-slate-500">
                        {ord.queueStatus} · {formatRupiah(ord.total)} ({ord.paymentStatus})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptOrder(ord)}
                      aria-label={`Cetak struk ${ord.orderNumber}`}
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-blue-50 hover:text-[#1D4ED8] cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#082B78] text-white p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-[#FACC15]" aria-hidden="true" />
                <h2 className="text-sm font-extrabold">Aktivasi Cepat Self-Service</h2>
              </div>
              <p className="text-xs text-blue-200">
                Mesin kosong siap aktif: {state.machines.filter((m) => m.status === 'Tersedia').length} unit.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('mesin')}
                className="w-full rounded-xl bg-[#FACC15] hover:bg-yellow-300 text-[#082B78] py-2.5 text-xs font-extrabold cursor-pointer"
              >
                Jual Token &amp; Aktifkan Mesin →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAPAN ANTREAN KANBAN (Drag-and-Drop + Click Controls + WA Notification) */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-extrabold text-[#082B78]">
                Papan Antrean Produksi (Kanban)
              </h1>
              <p className="text-xs text-slate-600">
                Seret kartu (drag &amp; drop) atau klik tombol panah untuk memindahkan status. Setiap
                perubahan otomatis mengirim notifikasi WhatsApp ke pelanggan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3.5 items-start">
            {QUEUE_STATUS_FLOW.map((colStatus, colIdx) => {
              const colOrders = queueOrders.filter((o) => o.queueStatus === colStatus);
              return (
                <div
                  key={colStatus}
                  data-testid={`kanban-col-${colStatus}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedOrderId) {
                      updateOrderQueueStatus(draggedOrderId, colStatus);
                      setDraggedOrderId(null);
                    }
                  }}
                  className="rounded-xl bg-slate-200/70 border border-slate-300/80 p-3 min-h-[360px] flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-300/70">
                    <h2 className="text-xs font-extrabold text-[#082B78]">
                      {colStatus === 'Siap' ? 'Siap Diambil' : colStatus}
                    </h2>
                    <span className="font-mono text-xs font-bold text-slate-600 tabular-nums">
                      {colOrders.length}
                    </span>
                  </div>

                  {colOrders.length === 0 ? (
                    <p className="text-[11px] text-slate-500 text-center py-8">Kosong</p>
                  ) : (
                    colOrders.map((order) => {
                      const nextStatus = getNextQueueStatus(order.queueStatus);
                      const prevStatus: QueueStatus | null =
                        colIdx > 0 ? QUEUE_STATUS_FLOW[colIdx - 1] : null;
                      return (
                        <div
                          key={order.id}
                          draggable
                          onDragStart={() => setDraggedOrderId(order.id)}
                          data-testid={`kanban-card-${order.orderNumber}`}
                          className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs space-y-2 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-mono text-[11px] font-bold text-[#0B3FA8]">
                              {order.orderNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => setReceiptOrder(order)}
                              aria-label={`Struk ${order.orderNumber}`}
                              className="text-slate-400 hover:text-[#1D4ED8] cursor-pointer"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{order.customerName}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {order.items[0]?.serviceName} ({order.items[0]?.quantity}{' '}
                              {order.items[0]?.unit})
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <span className="font-semibold text-[#1D4ED8]">{order.speed}</span>
                            <span className="font-mono font-bold tabular-nums">
                              {formatRupiah(order.total)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
                            {prevStatus ? (
                              <button
                                type="button"
                                onClick={() => updateOrderQueueStatus(order.id, prevStatus)}
                                aria-label={`Mundurkan ${order.orderNumber} ke ${prevStatus}`}
                                className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </button>
                            ) : (
                              <span />
                            )}
                            {nextStatus && (
                              <button
                                type="button"
                                onClick={() => updateOrderQueueStatus(order.id, nextStatus)}
                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white py-1.5 px-2 text-[11px] font-bold cursor-pointer"
                              >
                                {nextStatus === 'Siap' ? 'Siap' : nextStatus}
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TOKEN & MESIN SELF-SERVICE */}
      {activeTab === 'mesin' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-lg font-extrabold text-[#082B78]">
                Penjualan Token &amp; Kontrol Mesin Self-Service (IoT Simulasi)
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Aktifkan mesin cuci/pengering setelah pelanggan membeli token koin di kasir atau scan QRIS.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                aria-label="Nama pelanggan self-service"
                value={tokenCustomerName}
                onChange={(e) => setTokenCustomerName(e.target.value)}
                placeholder="Nama pelanggan"
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
              <select
                aria-label="Sumber pembayaran mesin"
                value={tokenPaySource}
                onChange={(e) => setTokenPaySource(e.target.value as 'Token' | 'QRIS')}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
              >
                <option value="Token">Token Koin (Kasir)</option>
                <option value="QRIS">Scan QRIS Mesin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.machines.map((machine) => {
              const isAvailable = machine.status === 'Tersedia';
              const isBusy = machine.status === 'Dipakai';
              return (
                <div
                  key={machine.id}
                  data-testid={`pos-machine-${machine.code}`}
                  className={`rounded-2xl border bg-white p-5 space-y-4 shadow-xs ${
                    isAvailable
                      ? 'border-emerald-200'
                      : isBusy
                      ? 'border-amber-300'
                      : 'border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-mono text-slate-500">
                        {machine.code} · {machine.type} · {machine.capacityKg} kg
                      </p>
                      <h2 className="text-base font-bold text-slate-900">{machine.name}</h2>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isAvailable
                          ? 'text-emerald-700'
                          : isBusy
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {machine.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 border-y border-slate-100 py-2.5 tabular-nums">
                    <span>
                      Tarif: <strong className="font-mono text-[#0B3FA8]">{formatRupiah(machine.pricePerCycle)}</strong>
                    </span>
                    <span>Durasi: {machine.durationMinutes} mnt</span>
                    <span>Total: {machine.totalCycles}x</span>
                  </div>

                  {isBusy ? (
                    <div className="space-y-2.5">
                      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 flex items-center justify-between">
                        <div className="text-xs">
                          <p className="text-amber-800 font-semibold">Sedang Dipakai</p>
                          <p className="text-amber-700 text-[11px]">{machine.currentCustomer}</p>
                        </div>
                        <span className="font-mono text-lg font-extrabold text-amber-900 tabular-nums">
                          {formatCountdown(machine.remainingSeconds)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => stopMachineSession(machine.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 py-2 text-xs font-bold cursor-pointer"
                      >
                        <StopCircle className="h-4 w-4" aria-hidden="true" />
                        Hentikan Sesi Manual
                      </button>
                    </div>
                  ) : isAvailable ? (
                    <button
                      type="button"
                      onClick={() =>
                        sellTokenAndActivateMachine({
                          machineId: machine.id,
                          customerName: tokenCustomerName.trim() || 'Walk-in',
                          paymentSource: tokenPaySource,
                        })
                      }
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white py-2.5 text-xs font-extrabold cursor-pointer"
                    >
                      <Coins className="h-4 w-4" aria-hidden="true" />
                      Aktifkan {machine.code} ({tokenPaySource})
                    </button>
                  ) : (
                    <p className="text-xs text-rose-700 font-semibold text-center py-2">
                      Mesin sedang dalam status Rusak/Perawatan
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: JEMPUT & ANTAR KURIR */}
      {activeTab === 'kurir' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
          <h1 className="text-lg font-extrabold text-[#082B78]">
            Pengelolaan Jemput &amp; Antar Kurir
          </h1>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-3 font-bold">No. Nota &amp; Pelanggan</th>
                  <th className="py-3 px-3 font-bold">Alamat &amp; Jadwal</th>
                  <th className="py-3 px-3 font-bold">Status Cucian</th>
                  <th className="py-3 px-3 font-bold">Tugaskan Kurir</th>
                  <th className="py-3 px-3 font-bold">Status Kurir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveryOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="py-3 px-3">
                      <p className="font-mono font-bold text-[#0B3FA8]">{ord.orderNumber}</p>
                      <p className="font-semibold text-slate-900">{ord.customerName}</p>
                      <p className="text-slate-500 font-mono">{ord.customerPhone}</p>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="text-slate-700">{ord.addressText || '-'}</p>
                      <p className="text-slate-500 mt-0.5">{ord.pickupSchedule || 'Sesuai antrean'}</p>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">{ord.queueStatus}</td>
                    <td className="py-3 px-3">
                      <select
                        aria-label={`Kurir untuk ${ord.orderNumber}`}
                        value={ord.courierId ?? ''}
                        onChange={(e) =>
                          assignCourierToOrder(
                            ord.id,
                            e.target.value,
                            ord.deliveryState ?? 'Menunggu Jemput'
                          )
                        }
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                      >
                        <option value="">-- Pilih Kurir --</option>
                        {couriers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        aria-label={`Status antar untuk ${ord.orderNumber}`}
                        value={ord.deliveryState ?? 'Menunggu Jemput'}
                        onChange={(e) =>
                          assignCourierToOrder(
                            ord.id,
                            ord.courierId ?? couriers[0]?.id ?? '',
                            e.target.value as NonNullable<Order['deliveryState']>
                          )
                        }
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold"
                      >
                        <option value="Menunggu Jemput">Menunggu Jemput</option>
                        <option value="Dijemput">Dijemput</option>
                        <option value="Di Outlet">Di Outlet</option>
                        <option value="Sedang Diantar">Sedang Diantar</option>
                        <option value="Terkirim">Terkirim</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SHIFT, PIUTANG & TUTUP KASIR */}
      {activeTab === 'shift' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            {/* Pelunasan DP & Piutang */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
              <h1 className="text-base font-extrabold text-[#082B78]">
                Tagihan Belum Lunas (DP / Piutang)
              </h1>
              {receivables.length === 0 ? (
                <p className="text-xs text-emerald-700 font-semibold">
                  Semua transaksi sudah lunas!
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {receivables.map((ord) => {
                    const sisa = ord.total - ord.paidAmount;
                    return (
                      <div key={ord.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-mono font-bold text-[#0B3FA8]">{ord.orderNumber}</p>
                          <p className="font-semibold text-slate-900">{ord.customerName}</p>
                          <p className="text-slate-500 tabular-nums">
                            Total {formatRupiah(ord.total)} · Dibayar {formatRupiah(ord.paidAmount)} ·{' '}
                            <strong className="text-rose-700">Sisa {formatRupiah(sisa)}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => settleOrderPayment(ord.id, 'Tunai')}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-bold cursor-pointer"
                          >
                            Lunasi Tunai
                          </button>
                          <button
                            type="button"
                            onClick={() => settleOrderPayment(ord.id, 'QRIS')}
                            className="rounded-lg bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white px-3 py-1.5 font-bold cursor-pointer"
                          >
                            Lunasi QRIS
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Log Notifikasi WhatsApp */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
              <h2 className="text-base font-extrabold text-[#082B78] flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Log Notifikasi WhatsApp Otomatis ({state.notifications.length})
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {state.notifications.slice(0, 8).map((n) => (
                  <div key={n.id} className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
                    <div className="flex justify-between gap-2 text-[11px] text-slate-500">
                      <span className="font-bold text-slate-800">
                        {n.recipientName} ({n.recipientPhone})
                      </span>
                      <span>{formatWIB(n.sentAt)}</span>
                    </div>
                    <p className="text-slate-700 mt-1">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ringkasan Tutup Kasir */}
          <div className="lg:col-span-5 rounded-2xl bg-[#082B78] text-white p-6 space-y-5">
            <div>
              <p className="text-xs text-blue-200">RINGKASAN SHIFT KASIR</p>
              <h2 className="text-xl font-extrabold mt-0.5">Tutup Kasir Harian</h2>
            </div>

            <dl className="space-y-3 text-sm tabular-nums">
              <div className="flex justify-between">
                <dt className="text-blue-200">Modal Kas Awal</dt>
                <dd className="font-mono font-semibold">{formatRupiah(300000)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-blue-200">Pemasukan Tunai / COD</dt>
                <dd className="font-mono font-bold text-[#FACC15]">
                  {formatRupiah(financial.cashTotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-blue-200">Pemasukan Non-Tunai (QRIS/VA/Transfer)</dt>
                <dd className="font-mono font-bold text-emerald-300">
                  {formatRupiah(financial.nonCashTotal)}
                </dd>
              </div>
              <div className="flex justify-between pt-3 border-t border-blue-800 text-base">
                <dt className="font-bold">Total Kas di Laci</dt>
                <dd className="font-mono font-extrabold text-white">
                  {formatRupiah(300000 + financial.cashTotal)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => closeCurrentShift('Dewi Lestari')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FACC15] hover:bg-yellow-300 text-[#082B78] py-3 text-sm font-extrabold cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Konfirmasi Tutup Shift Kasir
            </button>

            {state.shifts.filter((s) => s.status === 'Ditutup').length > 0 && (
              <div className="pt-3 border-t border-blue-800 space-y-2 text-xs">
                <p className="font-bold text-blue-200">Riwayat Tutup Shift:</p>
                {state.shifts
                  .filter((s) => s.status === 'Ditutup')
                  .slice(0, 3)
                  .map((s) => (
                    <div key={s.id} className="rounded-lg bg-white/10 p-2.5">
                      <p className="font-bold">{s.cashierName}</p>
                      <p className="text-blue-200 font-mono">
                        Tunai: {formatRupiah(s.cashTotal)} · Non-Tunai: {formatRupiah(s.nonCashTotal)}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ThermalReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </div>
  );
};
