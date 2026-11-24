import React, { useMemo, useState } from 'react';
import { Download, Plus, Trash2, AlertTriangle, PackagePlus } from 'lucide-react';
import { useLaundry } from '../../context/LaundryContext';
import {
  computeFinancialSummary,
  formatRupiah,
  generateCsvContent,
} from '../../utils/laundryRules';
import type { Expense, MembershipTier, UserRole } from '../../types/laundry';

/* ---------------- 1. PELANGGAN & MEMBERSHIP ---------------- */
export const AdminCustomersSection: React.FC = () => {
  const { state, topUpCustomerDeposit, updateCustomerMembership } = useLaundry();

  return (
    <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
      <div className="p-5 border-b border-slate-200">
        <h2 className="text-sm font-extrabold text-[#082B78]">
          Manajemen Pelanggan, Membership &amp; Saldo Deposit
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola tier loyalitas pelanggan dan tambah saldo deposit member.
        </p>
      </div>
      <table className="w-full text-left text-xs min-w-[700px]">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
          <tr>
            <th className="py-3 px-4 font-bold">Pelanggan</th>
            <th className="py-3 px-4 font-bold">Membership</th>
            <th className="py-3 px-4 text-right font-bold">Poin</th>
            <th className="py-3 px-4 text-right font-bold">Order</th>
            <th className="py-3 px-4 text-right font-bold">Saldo Deposit</th>
            <th className="py-3 px-4 text-right font-bold">Top-Up Cepat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {state.customers.map((c) => (
            <tr key={c.id}>
              <td className="py-3 px-4">
                <p className="font-bold text-slate-900">{c.name}</p>
                <p className="font-mono text-[11px] text-slate-500">{c.phone}</p>
              </td>
              <td className="py-3 px-4">
                <select
                  aria-label={`Tier membership ${c.name}`}
                  value={c.membership}
                  onChange={(e) =>
                    updateCustomerMembership(c.id, e.target.value as MembershipTier)
                  }
                  className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold"
                >
                  <option value="Reguler">Reguler</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                </select>
              </td>
              <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">{c.points}</td>
              <td className="py-3 px-4 text-right font-mono tabular-nums">{c.totalOrders}x</td>
              <td className="py-3 px-4 text-right font-mono font-bold text-[#0B3FA8] tabular-nums">
                {formatRupiah(c.depositBalance)}
              </td>
              <td className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => topUpCustomerDeposit(c.id, 50000)}
                  className="rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 font-bold cursor-pointer"
                >
                  +Rp 50.000
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ---------------- 2. KARYAWAN & PERAN (RBAC) ---------------- */
export const AdminEmployeesSection: React.FC = () => {
  const { state, saveEmployee, deleteEmployee } = useLaundry();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Kasir');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    saveEmployee({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@elaundry.id`,
      role,
      branchId: 'branch-kemang',
      active: true,
      shift: 'Pagi (07:00-15:00)',
    });
    setName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="rounded-xl bg-white border border-slate-200 p-5 space-y-3"
      >
        <h2 className="text-sm font-extrabold text-[#082B78]">
          Tambah Karyawan &amp; Hak Akses (RBAC)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            required
            placeholder="Nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
          <input
            type="tel"
            required
            placeholder="+62812..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
          />
          <input
            type="email"
            placeholder="email@elaundry.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
          <select
            aria-label="Peran karyawan"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
          >
            <option value="Owner">Owner</option>
            <option value="Admin">Admin</option>
            <option value="Kasir">Kasir</option>
            <option value="Operator">Operator</option>
            <option value="Kurir">Kurir</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white py-2 px-3 text-xs font-bold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Staff
          </button>
        </div>
      </form>

      <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[660px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="py-3 px-4 font-bold">Nama &amp; Kontak</th>
              <th className="py-3 px-4 font-bold">Peran (RBAC)</th>
              <th className="py-3 px-4 font-bold">Shift Kerja</th>
              <th className="py-3 px-4 font-bold">Hak Akses Modul</th>
              <th className="py-3 px-4 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.employees.map((emp) => (
              <tr key={emp.id}>
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900">{emp.name}</p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {emp.phone} · {emp.email}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <select
                    aria-label={`Ubah peran ${emp.name}`}
                    value={emp.role}
                    onChange={(e) => saveEmployee({ ...emp, role: e.target.value as UserRole })}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold text-[#0B3FA8]"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                    <option value="Kasir">Kasir</option>
                    <option value="Operator">Operator</option>
                    <option value="Kurir">Kurir</option>
                  </select>
                </td>
                <td className="py-3 px-4 text-slate-600">{emp.shift}</td>
                <td className="py-3 px-4 text-slate-600">
                  {emp.role === 'Owner'
                    ? 'Akses Penuh + Keuangan + RBAC'
                    : emp.role === 'Admin'
                    ? 'Layanan, Promo, Mesin, Inventaris'
                    : emp.role === 'Kasir'
                    ? 'POS, Token, Struk, Tutup Shift'
                    : emp.role === 'Operator'
                    ? 'Papan Antrean Kanban Produksi'
                    : 'Jemput & Antar Pesanan'}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => deleteEmployee(emp.id)}
                    aria-label={`Hapus karyawan ${emp.name}`}
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

/* ---------------- 3. KEUANGAN, PENGELUARAN & LABA RUGI + CSV ---------------- */
export const AdminFinanceSection: React.FC = () => {
  const { state, addExpense, deleteExpense, pushToast } = useLaundry();
  const [category, setCategory] = useState<Expense['category']>('Deterjen & Bahan');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(50000);
  const [date, setDate] = useState('2026-11-23');

  const summary = useMemo(
    () => computeFinancialSummary(state.orders, state.expenses, state.payments),
    [state.orders, state.expenses, state.payments]
  );

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;
    addExpense({
      date,
      category,
      description: description.trim(),
      amount,
      branchId: 'branch-kemang',
    });
    setDescription('');
  };

  const handleExportCsv = () => {
    const csv = generateCsvContent(
      ['No Order', 'Tanggal', 'Pelanggan', 'Model', 'Metode', 'Status Bayar', 'Total (Rp)', 'Dibayar (Rp)'],
      state.orders.map((o) => [
        o.orderNumber,
        o.createdAt.slice(0, 10),
        o.customerName,
        o.model,
        o.paymentMethod,
        o.paymentStatus,
        o.total,
        o.paidAmount,
      ])
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-keuangan-elaundry-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({
      title: 'Laporan CSV berhasil diekspor',
      description: `${state.orders.length} transaksi tersimpan ke file CSV.`,
      tone: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* P&L Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total Pemasukan</p>
          <p className="text-xl font-extrabold font-mono text-[#0B3FA8] tabular-nums mt-1">
            {formatRupiah(summary.totalRevenue)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total Pengeluaran</p>
          <p className="text-xl font-extrabold font-mono text-rose-700 tabular-nums mt-1">
            {formatRupiah(summary.totalExpenses)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-emerald-200 p-4">
          <p className="text-xs text-emerald-700 font-semibold">Laba Bersih (Laba Rugi)</p>
          <p className="text-xl font-extrabold font-mono text-emerald-700 tabular-nums mt-1">
            {formatRupiah(summary.netProfit)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col justify-between">
          <p className="text-xs text-slate-500">Ekspor Data Akuntansi</p>
          <button
            type="button"
            onClick={handleExportCsv}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#082B78] hover:bg-[#1D4ED8] text-white py-2 px-3 text-xs font-bold cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Unduh Laporan CSV
          </button>
        </div>
      </div>

      {/* Breakdown by Payment Method */}
      <div className="rounded-xl bg-white border border-slate-200 p-5">
        <h2 className="text-sm font-extrabold text-[#082B78] mb-3">
          Pemasukan per Metode Pembayaran
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(summary.byPaymentMethod).map(([method, total]) => (
            <div key={method} className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-[11px] text-slate-500">{method}</p>
              <p className="text-sm font-mono font-extrabold text-slate-900 tabular-nums mt-1">
                {formatRupiah(total)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses CRUD */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-extrabold text-[#082B78]">Catat Pengeluaran Operasional</h2>
        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
          <select
            aria-label="Kategori pengeluaran"
            value={category}
            onChange={(e) => setCategory(e.target.value as Expense['category'])}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          >
            <option value="Listrik">Listrik</option>
            <option value="Air">Air</option>
            <option value="Deterjen & Bahan">Deterjen &amp; Bahan</option>
            <option value="Gaji Karyawan">Gaji Karyawan</option>
            <option value="Perawatan Mesin">Perawatan Mesin</option>
            <option value="Lainnya">Lainnya</option>
          </select>
          <input
            type="text"
            required
            placeholder="Keterangan pengeluaran"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
          <input
            type="number"
            required
            min={1000}
            step={5000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white py-2 px-3 text-xs font-bold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Catat
          </button>
        </form>

        <div className="divide-y divide-slate-100 text-xs">
          {state.expenses.map((exp) => (
            <div key={exp.id} className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">
                  {exp.category} · <span className="font-normal text-slate-600">{exp.description}</span>
                </p>
                <p className="text-[11px] text-slate-500">{exp.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-rose-700 tabular-nums">
                  -{formatRupiah(exp.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => deleteExpense(exp.id)}
                  aria-label={`Hapus pengeluaran ${exp.description}`}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------------- 4. INVENTARIS BAHAN HABIS PAKAI ---------------- */
export const AdminInventorySection: React.FC = () => {
  const { state, saveInventoryItem, restockInventoryItem, deleteInventoryItem } = useLaundry();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('Liter');
  const [stock, setStock] = useState(10);
  const [minStock, setMinStock] = useState(5);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveInventoryItem({
      name: name.trim(),
      sku: sku.trim().toUpperCase() || `INV-${Date.now().toString().slice(-4)}`,
      unit,
      stock,
      minStock,
      costPerUnit: 25000,
      lastRestockedAt: new Date().toISOString().slice(0, 10),
    });
    setName('');
    setSku('');
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="rounded-xl bg-white border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
      >
        <div className="sm:col-span-2">
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Bahan</label>
          <input
            type="text"
            required
            placeholder="Deterjen / Pewangi / Plastik"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Satuan</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Stok Awal</label>
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Batas Minimum</label>
          <input
            type="number"
            min={1}
            value={minStock}
            onChange={(e) => setMinStock(Number(e.target.value) || 1)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white py-2 px-3 text-xs font-bold cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah
        </button>
      </form>

      <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[660px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="py-3 px-4 font-bold">SKU &amp; Item</th>
              <th className="py-3 px-4 text-right font-bold">Stok Saat Ini</th>
              <th className="py-3 px-4 text-right font-bold">Stok Minimum</th>
              <th className="py-3 px-4 font-bold">Status Stok</th>
              <th className="py-3 px-4 text-right font-bold">Restok Cepat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.inventory.map((item) => {
              const isLow = item.stock <= item.minStock;
              return (
                <tr key={item.id} className={isLow ? 'bg-amber-50/50' : ''}>
                  <td className="py-3 px-4">
                    <p className="font-mono text-[11px] text-slate-500">{item.sku}</p>
                    <p className="font-bold text-slate-900">{item.name}</p>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold tabular-nums text-slate-900">
                    {item.stock} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                    {item.minStock} {item.unit}
                  </td>
                  <td className="py-3 px-4">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-800">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Stok Menipis!
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-700">● Aman</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => restockInventoryItem(item.id, 10)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#0B3FA8] px-2.5 py-1.5 font-bold cursor-pointer"
                      >
                        <PackagePlus className="h-3.5 w-3.5" /> +10 {item.unit}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteInventoryItem(item.id)}
                        aria-label={`Hapus ${item.name}`}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
