import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { WashingMachine, ShieldCheck, Globe, UserCheck } from 'lucide-react';
import { useLaundry } from '../context/LaundryContext';

export const PosLayout: React.FC = () => {
  const { state } = useLaundry();
  const activeShift = state.shifts.find((s) => s.status === 'Aktif');

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Dedicated POS Cashier Top Bar — strictly separated from public website */}
      <header className="sticky top-0 z-40 bg-[#082B78] text-white border-b border-blue-900 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FACC15] text-[#082B78]">
              <WashingMachine className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="truncate">
              <span className="font-extrabold text-sm sm:text-base tracking-tight">
                E-Laundry POS &amp; Produksi
              </span>
              <span className="hidden md:inline text-xs text-blue-200 ml-2">
                · Outlet Kemang (WIB)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-blue-100">
              <UserCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              Kasir: <strong className="text-white">{activeShift?.cashierName ?? 'Dewi Lestari'}</strong>
            </span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 font-semibold text-white transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Admin Owner
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/40 hover:bg-white/10 px-3 py-1.5 font-semibold text-blue-100 hover:text-white transition-colors whitespace-nowrap"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              Web Publik
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};
