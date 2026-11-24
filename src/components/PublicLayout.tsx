import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Truck,
  Zap,
  Leaf,
  PhoneCall,
  Menu,
  X,
  WashingMachine,
  Store,
  ShieldCheck,
  MapPin,
  Mail,
  MessageCircle,
  Clock,
} from 'lucide-react';
import { useLaundry } from '../context/LaundryContext';

export const PublicLayout: React.FC = () => {
  const { state } = useLaundry();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Beranda', end: true },
    { to: '/layanan', label: 'Layanan' },
    { to: '/kalkulator', label: 'Kalkulator' },
    { to: '/lacak', label: 'Cek Status' },
    { to: '/akun', label: 'Akun' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Top Info Utility Bar (matches reference deep royal blue #0B3FA8) */}
      <div className="bg-[#0B3FA8] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-blue-100">
              <Truck className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
              Jemput &amp; Antar Gratis
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-blue-100">
              <Zap className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
              Express 24 Jam
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-blue-100">
              <Leaf className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              Ramah Lingkungan
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden lg:inline-flex items-center gap-1.5 text-blue-100">
              <PhoneCall className="h-3.5 w-3.5 text-blue-200" aria-hidden="true" />
              <span>Customer Support:</span>
              <strong className="font-semibold text-white">{state.settings.phone}</strong>
            </span>
            <span className="hidden lg:inline text-blue-300/60" aria-hidden="true">
              |
            </span>
            <div className="flex items-center gap-3">
              <Link
                to="/pos"
                className="inline-flex items-center gap-1 text-blue-100 hover:text-amber-300 transition-colors font-medium whitespace-nowrap"
              >
                <Store className="h-3.5 w-3.5" aria-hidden="true" />
                Panel Kasir
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 text-blue-100 hover:text-amber-300 transition-colors font-medium whitespace-nowrap"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Admin Owner
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Public Navbar: strict 3-zone contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] rounded-lg"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B3FA8] text-white shadow-xs group-hover:bg-[#1D4ED8] transition-colors">
              <WashingMachine className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-[#0B3FA8]">
              E-Laundry
            </span>
          </Link>

          {/* Zone 2: 5 clean single-line navigation links */}
          <nav
            aria-label="Navigasi utama pelanggan"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    isActive
                      ? 'text-[#0B3FA8] font-semibold border-[#1D4ED8]'
                      : 'border-transparent hover:text-[#0B3FA8]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/pesan"
              className="hidden sm:inline-flex items-center justify-center rounded-xl bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#0B3FA8] transition-colors whitespace-nowrap shrink-0"
            >
              Pesan Jemput
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-blue-50 text-[#0B3FA8] font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/pesan"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-xl bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Pesan Jemput Sekarang
              </Link>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/pos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Panel Kasir (POS)
                </Link>
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Admin Owner
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Deep Royal Blue Footer matching reference */}
      <footer className="bg-[#082B78] text-blue-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0B3FA8]">
                <WashingMachine className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-lg font-extrabold text-white leading-none">
                  {state.settings.businessName}
                </p>
                <p className="text-xs text-blue-200 mt-0.5">{state.settings.tagline}</p>
              </div>
            </div>
            <p className="text-sm text-blue-200 leading-relaxed max-w-md">
              Platform laundry UMKM modern yang menggabungkan layanan Self-Service mesin
              komersial, Full-Service antar-jemput gratis, dan paket Hybrid fleksibel untuk
              keluarga serta profesional di Indonesia.
            </p>
            <div className="flex items-center gap-3 text-xs text-blue-200">
              <Clock className="h-4 w-4 text-amber-300 shrink-0" aria-hidden="true" />
              <span>{state.settings.openHours}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">Tautan Pelanggan</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/layanan" className="hover:text-white transition-colors">
                  Katalog Layanan
                </Link>
              </li>
              <li>
                <Link to="/kalkulator" className="hover:text-white transition-colors">
                  Kalkulator Biaya
                </Link>
              </li>
              <li>
                <Link to="/pesan" className="hover:text-white transition-colors">
                  Pesan Jemput / Booking Mesin
                </Link>
              </li>
              <li>
                <Link to="/lacak" className="hover:text-white transition-colors">
                  Cek Status Cucian
                </Link>
              </li>
              <li>
                <Link to="/akun" className="hover:text-white transition-colors">
                  Akun &amp; Poin Loyalitas
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">Layanan Unggulan</h3>
            <ul className="space-y-2.5 text-sm">
              {state.services.slice(0, 6).map((srv) => (
                <li key={srv.id}>
                  <Link
                    to={`/pesan?service=${srv.id}`}
                    className="hover:text-white transition-colors"
                  >
                    {srv.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Kontak &amp; Portal Staff</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <PhoneCall className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{state.settings.phone}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{state.settings.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{state.settings.address}</span>
              </li>
            </ul>
            <div className="pt-2 space-y-2">
              <Link
                to="/pesan"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 transition-colors"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Pesan Cepat via WhatsApp
              </Link>
              <div className="flex items-center gap-2 text-xs pt-1">
                <Link
                  to="/pos"
                  className="flex-1 text-center rounded-lg border border-blue-400/40 px-2.5 py-2 hover:bg-white/10 text-white font-medium transition-colors"
                >
                  POS Kasir
                </Link>
                <Link
                  to="/admin"
                  className="flex-1 text-center rounded-lg border border-blue-400/40 px-2.5 py-2 hover:bg-white/10 text-white font-medium transition-colors"
                >
                  Admin Owner
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-300">
            <p>© 2026 E-Laundry Indonesia. Hak Cipta Dilindungi.</p>
            <div className="flex items-center gap-4">
              <Link to="/layanan" className="hover:text-white">
                Syarat &amp; Ketentuan
              </Link>
              <Link to="/lacak" className="hover:text-white">
                Garansi Cucian
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
