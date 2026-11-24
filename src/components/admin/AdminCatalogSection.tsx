import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Play, StopCircle, Check, X } from 'lucide-react';
import { useLaundry } from '../../context/LaundryContext';
import { ASSET_IMAGES } from '../../data/seedData';
import { formatCountdown, formatRupiah, formatWIB } from '../../utils/laundryRules';
import type {
  Machine,
  MachineStatus,
  MachineType,
  Promo,
  Service,
  ServiceCategory,
  ServiceModel,
  ServiceUnit,
} from '../../types/laundry';

/* ---------------- 1. LAYANAN & HARGA CRUD ---------------- */
export const AdminServicesSection: React.FC = () => {
  const { state, saveService, deleteService, updateSettings } = useLaundry();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('kiloan');
  const [model, setModel] = useState<ServiceModel>('full-service');
  const [unit, setUnit] = useState<ServiceUnit>('kg');
  const [priceReguler, setPriceReguler] = useState(7000);
  const [priceExpress, setPriceExpress] = useState(9800);
  const [pricePremium, setPricePremium] = useState(14000);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const [expressPct, setExpressPct] = useState(state.settings.pricing.expressMarkupPct);
  const [premiumPct, setPremiumPct] = useState(state.settings.pricing.premiumMarkupPct);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('kiloan');
    setModel('full-service');
    setUnit('kg');
    setPriceReguler(7000);
    setPriceExpress(Math.round(7000 * (1 + expressPct / 100)));
    setPricePremium(Math.round(7000 * (1 + premiumPct / 100)));
    setDescription('');
    setActive(true);
  };

  const handleEdit = (srv: Service) => {
    setEditingId(srv.id);
    setName(srv.name);
    setCategory(srv.category);
    setModel(srv.model);
    setUnit(srv.unit);
    setPriceReguler(srv.priceReguler);
    setPriceExpress(srv.priceExpress);
    setPricePremium(srv.pricePremium);
    setDescription(srv.description);
    setActive(srv.active);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveService({
      id: editingId ?? undefined,
      name: name.trim(),
      category,
      model,
      unit,
      priceReguler,
      priceExpress: model === 'self-service' ? priceReguler : priceExpress,
      pricePremium: model === 'self-service' ? priceReguler : pricePremium,
      description: description.trim() || 'Layanan laundry higienis dan profesional.',
      estimatedHours: model === 'self-service' ? 1 : 72,
      imageUrl:
        category === 'sepatu'
          ? ASSET_IMAGES.shoeCare
          : category === 'dry-cleaning'
          ? ASSET_IMAGES.dryClean
          : category === 'self-service'
          ? ASSET_IMAGES.selfLaundromat
          : ASSET_IMAGES.washFold,
      active,
      featured: true,
    });
    resetForm();
  };

  const handleSaveMultipliers = () => {
    updateSettings((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        expressMarkupPct: expressPct,
        premiumMarkupPct: premiumPct,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Markup Rule Bar */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-[#082B78]">
            Aturan Persentase Kecepatan (Express &amp; Premium)
          </h2>
          <p className="text-xs text-slate-500">
            Default: Express +40% dari reguler, Premium (hari sama) +100%.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="adm-exp-pct" className="block text-[11px] font-bold text-slate-600">
              Express (+%)
            </label>
            <input
              id="adm-exp-pct"
              type="number"
              value={expressPct}
              onChange={(e) => setExpressPct(Number(e.target.value) || 0)}
              className="w-20 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono font-bold"
            />
          </div>
          <div>
            <label htmlFor="adm-prm-pct" className="block text-[11px] font-bold text-slate-600">
              Premium (+%)
            </label>
            <input
              id="adm-prm-pct"
              type="number"
              value={premiumPct}
              onChange={(e) => setPremiumPct(Number(e.target.value) || 0)}
              className="w-20 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono font-bold"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveMultipliers}
            className="rounded-lg bg-[#0B3FA8] hover:bg-[#1D4ED8] text-white px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Simpan Aturan
          </button>
        </div>
      </div>

      {/* Service Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white border border-slate-200 p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#082B78]">
            {editingId ? 'Edit Layanan & Tarif' : 'Tambah Layanan Baru'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Batal Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            required
            placeholder="Nama layanan (mis. Cuci Karpet)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
          <select
            aria-label="Kategori layanan"
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          >
            <option value="kiloan">Kiloan</option>
            <option value="satuan">Satuan</option>
            <option value="self-service">Self-Service</option>
            <option value="dry-cleaning">Dry Cleaning</option>
            <option value="sepatu">Sepatu</option>
            <option value="bedcover">Bedcover</option>
            <option value="express">Express</option>
            <option value="khusus">Perawatan Khusus</option>
          </select>
          <select
            aria-label="Model layanan"
            value={model}
            onChange={(e) => setModel(e.target.value as ServiceModel)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          >
            <option value="full-service">Full-Service</option>
            <option value="self-service">Self-Service</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <select
            aria-label="Satuan layanan"
            value={unit}
            onChange={(e) => setUnit(e.target.value as ServiceUnit)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          >
            <option value="kg">per kg</option>
            <option value="item">per item</option>
            <option value="pasang">per pasang</option>
            <option value="siklus">per siklus</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Harga Reguler (Rp)</label>
            <input
              type="number"
              min={1000}
              step={500}
              value={priceReguler}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                setPriceReguler(v);
                setPriceExpress(Math.round(v * (1 + expressPct / 100)));
                setPricePremium(Math.round(v * (1 + premiumPct / 100)));
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Harga Express (Rp)</label>
            <input
              type="number"
              min={1000}
              step={500}
              value={priceExpress}
              onChange={(e) => setPriceExpress(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Harga Premium (Rp)</label>
            <input
              type="number"
              min={1000}
              step={500}
              value={pricePremium}
              onChange={(e) => setPricePremium(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold"
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 pb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="accent-[#1D4ED8]"
              />
              Aktif
            </label>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white py-2 px-3 text-xs font-bold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              {editingId ? 'Update' : 'Simpan'}
            </button>
          </div>
        </div>
      </form>

      {/* Services Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[680px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="py-3 px-4 font-bold">Layanan</th>
              <th className="py-3 px-4 font-bold">Model / Satuan</th>
              <th className="py-3 px-4 text-right font-bold">Reguler</th>
              <th className="py-3 px-4 text-right font-bold">Express</th>
              <th className="py-3 px-4 text-right font-bold">Premium</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.services.map((srv) => (
              <tr key={srv.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-bold text-slate-900">{srv.name}</td>
                <td className="py-3 px-4 text-slate-600">
                  {srv.model} · /{srv.unit}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                  {formatRupiah(srv.priceReguler)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-[#0B3FA8] tabular-nums">
                  {formatRupiah(srv.priceExpress)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-[#1D4ED8] tabular-nums">
                  {formatRupiah(srv.pricePremium)}
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => saveService({ ...srv, active: !srv.active })}
                    className={`font-bold cursor-pointer ${
                      srv.active ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {srv.active ? '● Aktif' : '○ Nonaktif'}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEdit(srv)}
                      aria-label={`Edit ${srv.name}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-[#1D4ED8] cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteService(srv.id)}
                      aria-label={`Hapus ${srv.name}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------- 2. MESIN & IoT CRUD ---------------- */
export const AdminMachinesSection: React.FC = () => {
  const { state, saveMachine, deleteMachine, sellTokenAndActivateMachine, stopMachineSession } =
    useLaundry();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<MachineType>('Cuci');
  const [capacityKg, setCapacityKg] = useState(12);
  const [pricePerCycle, setPricePerCycle] = useState(22000);
  const [durationMinutes, setDurationMinutes] = useState(40);

  const handleAddMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    saveMachine({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      capacityKg,
      pricePerCycle,
      durationMinutes,
      status: 'Tersedia',
      remainingSeconds: 0,
      totalCycles: 0,
      branchId: 'branch-kemang',
    });
    setCode('');
    setName('');
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAddMachine}
        className="rounded-xl bg-white border border-slate-200 p-5 space-y-3"
      >
        <h2 className="text-sm font-extrabold text-[#082B78]">Tambah Mesin Self-Service / IoT</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            type="text"
            required
            placeholder="Kode (W-04)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono uppercase"
          />
          <input
            type="text"
            required
            placeholder="Nama Mesin"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
          <select
            aria-label="Tipe mesin"
            value={type}
            onChange={(e) => setType(e.target.value as MachineType)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          >
            <option value="Cuci">Mesin Cuci</option>
            <option value="Pengering">Pengering</option>
          </select>
          <input
            type="number"
            aria-label="Kapasitas kg"
            min={5}
            value={capacityKg}
            onChange={(e) => setCapacityKg(Number(e.target.value) || 10)}
            placeholder="Kg"
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
          />
          <input
            type="number"
            aria-label="Tarif per siklus"
            step={1000}
            value={pricePerCycle}
            onChange={(e) => setPricePerCycle(Number(e.target.value) || 20000)}
            placeholder="Tarif Rp"
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs text-slate-600 flex items-center gap-2">
            Durasi siklus (menit):
            <input
              type="number"
              min={10}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value) || 40)}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white px-4 py-2 text-xs font-bold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Mesin
          </button>
        </div>
      </form>

      {/* Machine Fleet Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[740px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="py-3 px-4 font-bold">Kode &amp; Mesin</th>
              <th className="py-3 px-4 font-bold">Tipe / Kapasitas</th>
              <th className="py-3 px-4 text-right font-bold">Tarif / Durasi</th>
              <th className="py-3 px-4 font-bold">Status IoT</th>
              <th className="py-3 px-4 font-bold">Kontrol IoT (Fase 2 Simulasi)</th>
              <th className="py-3 px-4 text-right font-bold">Hapus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.machines.map((m: Machine) => (
              <tr key={m.id}>
                <td className="py-3 px-4">
                  <p className="font-mono font-bold text-[#0B3FA8]">{m.code}</p>
                  <p className="font-semibold text-slate-900">{m.name}</p>
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {m.type} · {m.capacityKg} kg ({m.totalCycles} siklus)
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  <p className="font-bold text-slate-900">{formatRupiah(m.pricePerCycle)}</p>
                  <p className="text-[11px] text-slate-500">{m.durationMinutes} mnt</p>
                </td>
                <td className="py-3 px-4">
                  <select
                    aria-label={`Status mesin ${m.code}`}
                    value={m.status}
                    onChange={(e) =>
                      saveMachine({
                        ...m,
                        status: e.target.value as MachineStatus,
                        remainingSeconds: e.target.value === 'Dipakai' ? m.durationMinutes * 60 : 0,
                      })
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Dipakai">Dipakai</option>
                    <option value="Rusak">Rusak / Perawatan</option>
                  </select>
                  {m.status === 'Dipakai' && (
                    <p className="text-[11px] font-mono text-amber-700 mt-1 tabular-nums">
                      Sisa: {formatCountdown(m.remainingSeconds)}
                    </p>
                  )}
                </td>
                <td className="py-3 px-4">
                  {m.status === 'Tersedia' ? (
                    <button
                      type="button"
                      onClick={() =>
                        sellTokenAndActivateMachine({
                          machineId: m.id,
                          customerName: 'Uji IoT Admin',
                          paymentSource: 'QRIS',
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-bold cursor-pointer"
                    >
                      <Play className="h-3 w-3" /> Start IoT
                    </button>
                  ) : m.status === 'Dipakai' ? (
                    <button
                      type="button"
                      onClick={() => stopMachineSession(m.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 font-bold cursor-pointer"
                    >
                      <StopCircle className="h-3 w-3" /> Stop
                    </button>
                  ) : (
                    <span className="text-slate-400">Offline</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => deleteMachine(m.id)}
                    aria-label={`Hapus mesin ${m.code}`}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Machine Usage History */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-[#082B78]">Riwayat Pemakaian Mesin Terbaru</h3>
        <div className="divide-y divide-slate-100 text-xs">
          {state.machineSessions.slice(0, 6).map((s) => (
            <div key={s.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900">
                  {s.machineName} · <span className="text-[#0B3FA8]">{s.customerName}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  {s.paymentSource} · Mulai {formatWIB(s.startedAt)} ({s.durationMinutes} mnt)
                </p>
              </div>
              <div className="text-right font-mono">
                <p className="font-bold text-slate-900">{formatRupiah(s.amount)}</p>
                <p className={s.status === 'Berjalan' ? 'text-amber-700 font-bold' : 'text-emerald-700'}>
                  {s.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------------- 3. PROMO & DISKON CRUD ---------------- */
export const AdminPromosSection: React.FC = () => {
  const { state, savePromo, deletePromo } = useLaundry();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'percent' | 'nominal'>('percent');
  const [value, setValue] = useState(15);
  const [maxDiscount, setMaxDiscount] = useState(20000);
  const [minSpend, setMinSpend] = useState(30000);
  const [quota, setQuota] = useState(100);
  const [endDate, setEndDate] = useState('2026-12-31');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) return;
    savePromo({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      type,
      value,
      maxDiscount: type === 'percent' ? maxDiscount : undefined,
      minSpend,
      quota,
      usedCount: 0,
      startDate: '2026-01-01',
      endDate,
      firstOrderOnly: false,
      applicableModels: ['full-service', 'hybrid', 'self-service'],
      active: true,
    });
    setCode('');
    setTitle('');
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white border border-slate-200 p-5 space-y-3"
      >
        <h2 className="text-sm font-extrabold text-[#082B78]">Buat Kode Promo Baru</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            required
            placeholder="Kode Promo (CUCIHEMAT)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono uppercase"
          />
          <input
            type="text"
            required
            placeholder="Judul promo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
          <select
            aria-label="Tipe diskon"
            value={type}
            onChange={(e) => setType(e.target.value as 'percent' | 'nominal')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          >
            <option value="percent">Persentase (%)</option>
            <option value="nominal">Potongan Nominal (Rp)</option>
          </select>
          <input
            type="number"
            required
            placeholder="Nilai (% atau Rp)"
            value={value}
            onChange={(e) => setValue(Number(e.target.value) || 0)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Min. Belanja (Rp)</label>
            <input
              type="number"
              value={minSpend}
              onChange={(e) => setMinSpend(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Kuota Pemakaian</label>
            <input
              type="number"
              value={quota}
              onChange={(e) => setQuota(Number(e.target.value) || 50)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Berlaku Sampai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white py-2 px-4 text-xs font-bold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Simpan Promo
          </button>
        </div>
      </form>

      <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[660px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="py-3 px-4 font-bold">Kode &amp; Nama Promo</th>
              <th className="py-3 px-4 font-bold">Nilai Diskon</th>
              <th className="py-3 px-4 text-right font-bold">Min. Belanja</th>
              <th className="py-3 px-4 font-bold">Kuota / Periode</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.promos.map((p: Promo) => (
              <tr key={p.id}>
                <td className="py-3 px-4">
                  <p className="font-mono font-extrabold text-[#0B3FA8]">{p.code}</p>
                  <p className="text-slate-700">{p.title}</p>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                  {p.type === 'percent'
                    ? `${p.value}% (maks ${formatRupiah(p.maxDiscount ?? 0)})`
                    : formatRupiah(p.value)}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  {formatRupiah(p.minSpend)}
                </td>
                <td className="py-3 px-4 text-slate-600 tabular-nums">
                  {p.usedCount}/{p.quota} terpakai · s.d. {p.endDate}
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => savePromo({ ...p, active: !p.active })}
                    className={`inline-flex items-center gap-1 font-bold cursor-pointer ${
                      p.active ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {p.active ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    {p.active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => deletePromo(p.id)}
                    aria-label={`Hapus promo ${p.code}`}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
