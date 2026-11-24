import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Wallet,
  MapPin,
  RotateCcw,
  LogOut,
  Printer,
  Plus,
  Trash2,
  MessageCircle,
  KeyRound,
  History,
} from 'lucide-react';
import { useLaundry } from '../context/LaundryContext';
import { formatRupiah, formatWIB } from '../utils/laundryRules';
import type { Order } from '../types/laundry';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';

export const CustomerPortalPage: React.FC = () => {
  const {
    state,
    loginCustomerByPhone,
    logoutCustomer,
    addCustomerAddress,
    deleteCustomerAddress,
    sendManualWhatsApp,
    pushToast,
  } = useLaundry();

  const activeCustomer = state.customers.find((c) => c.id === state.activeCustomerId) ?? null;

  // OTP Login Flow
  const [phoneInput, setPhoneInput] = useState('+6281234567890');
  const [nameInput, setNameInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  // Customer Dashboard state
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('Jakarta Selatan');

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (phoneInput.replace(/\D/g, '').length < 9) {
      setOtpError('Masukkan nomor WhatsApp yang valid (+62...).');
      return;
    }
    setOtpSent(true);
    setOtpCode('123456');
    sendManualWhatsApp({
      phone: phoneInput,
      name: nameInput || 'Pelanggan E-Laundry',
      message: 'Kode OTP Login E-Laundry Anda adalah 123456 (berlaku 5 menit). Jangan bagikan kode ini.',
      templateKey: 'otp',
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (otpCode.trim() !== '123456') {
      setOtpError('Kode OTP salah. Gunakan kode simulasi 123456.');
      return;
    }
    const cust = loginCustomerByPhone(phoneInput, nameInput);
    pushToast({
      title: `Selamat datang kembali, ${cust.name}!`,
      tone: 'success',
    });
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !addrLabel.trim() || !addrStreet.trim()) return;
    addCustomerAddress(activeCustomer.id, {
      label: addrLabel.trim(),
      street: addrStreet.trim(),
      district: addrDistrict.trim() || 'Jakarta Selatan',
      city: 'DKI Jakarta',
      isDefault: activeCustomer.addresses.length === 0,
    });
    setAddrLabel('');
    setAddrStreet('');
    setShowAddAddress(false);
  };

  if (!activeCustomer) {
    return (
      <div className="bg-[#F4F8FF] min-h-[80vh] py-14">
        <div className="max-w-md mx-auto px-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-7 shadow-sm space-y-6">
            <div className="text-center space-y-1.5">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8] mx-auto">
                <MessageCircle className="h-6 w-6" aria-hidden="true" />
              </span>
              <h1 className="text-2xl font-extrabold text-[#082B78]">Login Akun Pelanggan</h1>
              <p className="text-xs text-slate-600">
                Masuk cepat menggunakan OTP WhatsApp untuk melihat riwayat nota, poin loyalitas,
                saldo deposit, dan pesan ulang 1 klik.
              </p>
            </div>

            {otpError && (
              <div role="alert" className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                {otpError}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor WhatsApp Terdaftar
                  </label>
                  <input
                    id="otp-phone"
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+6281234567890"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono focus:border-[#1D4ED8] focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Akun demo siap pakai: <span className="font-mono">+6281234567890</span> (Rina Kusuma · Gold)
                  </p>
                </div>
                <div>
                  <label htmlFor="otp-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama (opsional untuk pengguna baru)
                  </label>
                  <input
                    id="otp-name"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Isi jika belum pernah mendaftar"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white py-3 text-sm font-bold transition-colors cursor-pointer"
                >
                  Kirim Kode OTP WhatsApp
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
                  Simulasi OTP terkirim ke <strong className="font-mono">{phoneInput}</strong>.
                  Kode OTP simulasi: <strong className="font-mono">123456</strong>
                </div>
                <div>
                  <label htmlFor="otp-code" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Masukkan 6 Digit Kode OTP
                  </label>
                  <div className="relative">
                    <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="otp-code"
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-center font-mono text-base font-bold tracking-widest focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-sm font-bold transition-colors cursor-pointer"
                >
                  Verifikasi &amp; Masuk Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Ganti nomor WhatsApp
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const customerOrders = state.orders.filter((o) => o.customerId === activeCustomer.id);

  return (
    <div className="bg-[#F4F8FF] min-h-[80vh] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="rounded-2xl bg-[#082B78] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-blue-200">
              Akun Pelanggan · Member {activeCustomer.membership}
            </p>
            <h1 className="text-2xl font-extrabold mt-0.5">{activeCustomer.name}</h1>
            <p className="text-xs font-mono text-blue-200 mt-0.5">{activeCustomer.phone}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/pesan"
              className="rounded-xl bg-[#FACC15] hover:bg-yellow-300 text-[#082B78] px-4 py-2.5 text-xs font-extrabold"
            >
              + Pesan Laundry Baru
            </Link>
            <button
              type="button"
              onClick={logoutCustomer}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-400/40 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </div>

        {/* 3 Membership / Loyalty / Deposit KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl bg-white border border-slate-200 p-5 flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Award className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-slate-500">Poin Loyalitas ({activeCustomer.membership})</p>
              <p className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
                {activeCustomer.points} Poin
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-5 flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Wallet className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-slate-500">Saldo Deposit Member</p>
              <p className="text-2xl font-extrabold font-mono text-[#0B3FA8] tabular-nums">
                {formatRupiah(activeCustomer.depositBalance)}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-5 flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-[#1D4ED8]">
              <History className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-slate-500">Total Transaksi Selesai</p>
              <p className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
                {customerOrders.length} Order
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Riwayat Order & Nota + Reorder */}
          <section className="lg:col-span-8 rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-[#082B78]">Riwayat Order &amp; Nota</h2>
            {customerOrders.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Belum ada riwayat pesanan. Mulai pesanan pertama Anda dengan kode{' '}
                <strong className="font-mono text-[#0B3FA8]">WELCOME20</strong>!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {customerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-[#0B3FA8]">
                          {order.orderNumber}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-semibold text-slate-700">{order.queueStatus}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{formatWIB(order.createdAt)}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {order.items
                          .map((i) => `${i.serviceName} (${i.quantity} ${i.unit})`)
                          .join(', ')}
                      </p>
                      <p className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
                        Total: {formatRupiah(order.total)} · {order.paymentMethod} ({order.paymentStatus})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                        Nota
                      </button>
                      <Link
                        to={`/pesan?service=${order.items[0]?.serviceId ?? ''}&qty=${
                          order.items[0]?.quantity ?? 4
                        }&speed=${order.speed}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white px-3.5 py-2 text-xs font-semibold"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        Pesan Ulang
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Alamat Tersimpan */}
          <section className="lg:col-span-4 rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#082B78]">Alamat Tersimpan</h2>
              <button
                type="button"
                onClick={() => setShowAddAddress((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah
              </button>
            </div>

            {showAddAddress && (
              <form onSubmit={handleSaveAddress} className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Label (mis. Rumah / Kantor)"
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Alamat jalan lengkap"
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Kecamatan / Kota"
                  value={addrDistrict}
                  onChange={(e) => setAddrDistrict(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#0B3FA8] text-white py-2 text-xs font-bold cursor-pointer"
                >
                  Simpan Alamat
                </button>
              </form>
            )}

            <div className="space-y-3">
              {activeCustomer.addresses.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada alamat tersimpan.</p>
              ) : (
                activeCustomer.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="rounded-xl border border-slate-200 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden="true" />
                        {addr.label}
                        {addr.isDefault && (
                          <span className="text-[10px] font-semibold text-emerald-700">· Utama</span>
                        )}
                      </span>
                      <button
                        type="button"
                        aria-label={`Hapus alamat ${addr.label}`}
                        onClick={() => deleteCustomerAddress(activeCustomer.id, addr.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{addr.street}</p>
                    <p className="text-slate-500">
                      {addr.district}, {addr.city}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <ThermalReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </div>
  );
};
