import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Shirt,
  WashingMachine,
  Tag,
  Users,
  ShieldCheck,
  Wallet,
  Boxes,
  Bot,
  Settings,
  Store,
  Globe,
  Menu,
  X,
} from 'lucide-react';
import { useLaundry } from '../context/LaundryContext';
import { AdminOverviewSection } from '../components/admin/AdminOverviewSection';
import {
  AdminMachinesSection,
  AdminPromosSection,
  AdminServicesSection,
} from '../components/admin/AdminCatalogSection';
import {
  AdminCustomersSection,
  AdminEmployeesSection,
  AdminFinanceSection,
  AdminInventorySection,
} from '../components/admin/AdminOperationsSection';
import {
  AdminHermesBotSection,
  AdminSettingsSection,
} from '../components/admin/AdminBotAndSettingsSection';
import { getLowStockItems } from '../utils/laundryRules';

type AdminTab =
  | 'ringkasan'
  | 'layanan'
  | 'mesin'
  | 'promo'
  | 'pelanggan'
  | 'karyawan'
  | 'keuangan'
  | 'inventaris'
  | 'bot'
  | 'pengaturan';

const NAV_ITEMS: { key: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
  { key: 'layanan', label: 'Layanan & Harga', icon: Shirt },
  { key: 'mesin', label: 'Mesin & IoT', icon: WashingMachine },
  { key: 'promo', label: 'Promo & Diskon', icon: Tag },
  { key: 'pelanggan', label: 'Pelanggan & Member', icon: Users },
  { key: 'karyawan', label: 'Karyawan & RBAC', icon: ShieldCheck },
  { key: 'keuangan', label: 'Keuangan & Laba Rugi', icon: Wallet },
  { key: 'inventaris', label: 'Inventaris Bahan', icon: Boxes },
  { key: 'bot', label: 'Bot Hermes Agent', icon: Bot },
  { key: 'pengaturan', label: 'Pengaturan & Integrasi', icon: Settings },
];

export const AdminPage: React.FC = () => {
  const { state } = useLaundry();
  const [activeTab, setActiveTab] = useState<AdminTab>('ringkasan');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const lowStockCount = getLowStockItems(state.inventory).length;
  const activeMeta = NAV_ITEMS.find((i) => i.key === activeTab) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Desktop Sidebar (250px fixed) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#082B78] text-white border-r border-blue-950">
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-blue-900/80">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FACC15] text-[#082B78]">
            <WashingMachine className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-extrabold leading-none">E-Laundry Owner</p>
            <p className="text-[11px] text-blue-200 mt-0.5">Panel Manajemen UMKM</p>
          </div>
        </div>

        <nav aria-label="Menu Admin Owner" className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-[#082B78] shadow-xs'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2.5 truncate">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </span>
                {item.key === 'inventaris' && lowStockCount > 0 && (
                  <span className="font-mono text-[10px] font-extrabold text-amber-400">
                    {lowStockCount}!
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-blue-900/80 space-y-1.5">
          <Link
            to="/pos"
            className="w-full inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
          >
            <Store className="h-4 w-4 text-[#FACC15]" aria-hidden="true" />
            Buka Panel Kasir (POS)
          </Link>
          <Link
            to="/"
            className="w-full inline-flex items-center gap-2 rounded-xl border border-blue-400/30 hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-blue-100 transition-colors"
          >
            <Globe className="h-4 w-4" aria-hidden="true" />
            Lihat Website Publik
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 max-w-[80vw] bg-[#082B78] text-white flex flex-col z-10">
            <div className="h-14 px-4 flex items-center justify-between border-b border-blue-900">
              <span className="font-extrabold text-sm">E-Laundry Owner</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Tutup sidebar"
                className="p-1.5 text-blue-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.key);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold ${
                      active ? 'bg-white text-[#082B78]' : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Clean Contextual Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu admin"
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="truncate">
              <p className="text-[11px] font-semibold text-slate-500">
                Admin Owner / {activeMeta.label}
              </p>
              <h1 className="text-base sm:text-lg font-extrabold text-[#082B78] truncate">
                {activeMeta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/pos"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white px-3.5 py-2 text-xs font-bold whitespace-nowrap"
            >
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              Panel Kasir
            </Link>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
            >
              Web Publik
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
          {activeTab === 'ringkasan' && (
            <AdminOverviewSection onNavigateTab={(t) => setActiveTab(t as AdminTab)} />
          )}
          {activeTab === 'layanan' && <AdminServicesSection />}
          {activeTab === 'mesin' && <AdminMachinesSection />}
          {activeTab === 'promo' && <AdminPromosSection />}
          {activeTab === 'pelanggan' && <AdminCustomersSection />}
          {activeTab === 'karyawan' && <AdminEmployeesSection />}
          {activeTab === 'keuangan' && <AdminFinanceSection />}
          {activeTab === 'inventaris' && <AdminInventorySection />}
          {activeTab === 'bot' && <AdminHermesBotSection />}
          {activeTab === 'pengaturan' && <AdminSettingsSection />}
        </main>
      </div>
    </div>
  );
};
