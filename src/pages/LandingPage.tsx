import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  PlayCircle,
  Truck,
  Sparkles,
  Zap,
  BadgePercent,
  Shirt,
  Wind,
  Footprints,
  BedDouble,
  Star,
  ShieldCheck,
  Clock,
  Lock,
  Leaf,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  PhoneCall,
  CalendarCheck,
  WashingMachine,
  QrCode,
  Coins,
  Copy,
  Check,
  Calculator,
  Layers,
} from 'lucide-react';
import { useLaundry } from '../context/LaundryContext';
import { ASSET_IMAGES } from '../data/seedData';
import { formatCountdown, formatRupiah } from '../utils/laundryRules';
import type { ServiceCategory } from '../types/laundry';

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Rina Kusuma',
    city: 'Jakarta Selatan',
    role: 'Ibu Rumah Tangga · Member Gold',
    quote:
      'Pelayanan luar biasa! Pakaian selalu wangi segar, lipatan sangat rapi, dan kurir jemput tepat waktu setiap minggu.',
    initials: 'RK',
  },
  {
    id: 't2',
    name: 'Budi Santoso',
    city: 'Tangerang Selatan',
    role: 'Konsultan · Pengguna Express',
    quote:
      'Sangat profesional untuk dry cleaning jas kantor. Fitur lacak status dan notifikasi WhatsApp otomatisnya benar-benar memudahkan.',
    initials: 'BS',
  },
  {
    id: 't3',
    name: 'Nadia Putri Maharani',
    city: 'Jakarta Selatan',
    role: 'Desainer Produk · Paket Hybrid',
    quote:
      'Suka sekali dengan model Hybrid! Cuci sendiri cepat pakai QRIS, lalu tinggal titip setrika uap. Hemat waktu dan biaya.',
    initials: 'NP',
  },
  {
    id: 't4',
    name: 'Dimas Pratama',
    city: 'Depok',
    role: 'Karyawan Swasta · Self-Service',
    quote:
      'Mesin self-service bersih dan modern. Bisa cek mesin kosong langsung dari HP sebelum berangkat ke outlet Kemang.',
    initials: 'DP',
  },
];

const FAQS = [
  {
    q: 'Apa perbedaan layanan Self-Service, Full-Service, dan Hybrid di E-Laundry?',
    a: 'Self-Service berarti Anda mencuci/mengeringkan sendiri dengan mesin komersial (40–45 menit selesai, bayar token atau QRIS). Full-Service dikerjakan penuh oleh tim kami lengkap dengan antar-jemput gratis. Hybrid memadukan keduanya: cuci sendiri lalu titip setrika/lipat di kasir.',
  },
  {
    q: 'Apakah penjemputan dan pengantaran benar-benar gratis?',
    a: 'Ya, gratis ongkir jemput & antar untuk radius 5 km dari outlet kami dengan minimal transaksi Rp 30.000. Di bawah minimal tersebut dikenakan biaya flat Rp 8.000.',
  },
  {
    q: 'Bagaimana cara kerja kode promo WELCOME20?',
    a: 'Pelanggan baru otomatis berhak mendapatkan diskon 20% (maksimal potongan Rp 20.000) dengan minimal transaksi Rp 15.000 pada pesanan pertama dengan memasukkan kode WELCOME20 di halaman pemesanan atau kalkulator.',
  },
  {
    q: 'Berapa lama waktu pengerjaan Reguler, Express, dan Premium?',
    a: 'Reguler selesai dalam 3 hari (72 jam), Express selesai dalam 24 jam (+40% dari tarif reguler), dan Premium selesai di hari yang sama dalam 6 jam (+100% dari tarif reguler).',
  },
  {
    q: 'Bagaimana cara mengecek status cucian saya?',
    a: 'Cukup buka menu Cek Status dan masukkan nomor nota (format LDR-YYYYMMDD-0001) atau nomor HP Anda. Kami juga mengirimkan update otomatis melalui WhatsApp di setiap tahapan proses.',
  },
];

function getCategoryIcon(category: ServiceCategory) {
  switch (category) {
    case 'kiloan':
      return Shirt;
    case 'dry-cleaning':
      return Sparkles;
    case 'satuan':
      return Wind;
    case 'sepatu':
      return Footprints;
    case 'bedcover':
      return BedDouble;
    case 'self-service':
      return WashingMachine;
    case 'express':
      return Zap;
    default:
      return ShieldCheck;
  }
}

export const LandingPage: React.FC = () => {
  const { state, pushToast } = useLaundry();
  const pageRef = useRef<HTMLDivElement>(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeServices = state.services.filter((s) => s.active);
  const availableMachinesCount = state.machines.filter((m) => m.status === 'Tersedia').length;

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.hero-stagger', {
        y: 22,
        opacity: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  const handleCopyPromo = () => {
    navigator.clipboard?.writeText('WELCOME20').catch(() => {});
    setCopiedCode(true);
    pushToast({
      title: 'Kode WELCOME20 disalin',
      description: 'Gunakan saat checkout untuk diskon 20% (maks Rp 20.000).',
      tone: 'success',
    });
    window.setTimeout(() => setCopiedCode(false), 2500);
  };

  const visibleTestimonials = [
    TESTIMONIALS[testimonialIdx % TESTIMONIALS.length],
    TESTIMONIALS[(testimonialIdx + 1) % TESTIMONIALS.length],
    TESTIMONIALS[(testimonialIdx + 2) % TESTIMONIALS.length],
  ];

  return (
    <div ref={pageRef} className="overflow-x-clip">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-br from-white via-[#F4F8FF] to-[#E2EEFF] border-b border-blue-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h1 className="hero-stagger text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.08] text-[#082B78] text-balance">
              Pakaian Bersih,{' '}
              <span className="text-[#1D4ED8] block mt-1">Hidup Segar!</span>
            </h1>

            <p className="hero-stagger text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Layanan laundry &amp; dry cleaning UMKM profesional dengan perawatan higienis,
              pilihan mesin self-service modern, dan antar-jemput tepat waktu di area Anda.
            </p>

            {/* 4 Key Hero Highlights (matching reference inline icon row) */}
            <div className="hero-stagger grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {[
                { icon: Truck, label: 'Jemput & Antar Gratis' },
                { icon: ShieldCheck, label: '100% Higienis' },
                { icon: Zap, label: 'Express 24 Jam' },
                { icon: BadgePercent, label: 'Tarif Transparan' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#1D4ED8] shadow-xs border border-blue-100">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold text-slate-700 leading-tight">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Hero Primary & Secondary CTAs */}
            <div className="hero-stagger flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/pesan"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-700/20 hover:bg-[#0B3FA8] transition-colors whitespace-nowrap"
              >
                Pesan Jemput Gratis
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#cara-kerja"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1D4ED8]/30 bg-white px-5 py-3.5 text-sm font-semibold text-[#0B3FA8] hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                <PlayCircle className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
                Cara Kerja
              </a>
              <Link
                to="/kalkulator"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#1D4ED8] hover:text-[#0B3FA8] underline underline-offset-4 whitespace-nowrap"
              >
                <Calculator className="h-4 w-4" aria-hidden="true" />
                Hitung Estimasi
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 hero-stagger">
            <div className="relative rounded-2xl overflow-hidden bg-white shadow-xl shadow-blue-900/10 border border-blue-100 aspect-[4/3]">
              <img
                src={ASSET_IMAGES.heroMachine}
                alt="Mesin cuci front-load modern E-Laundry beserta keranjang handuk bersih dan tanaman segar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES GRID (Layanan Laundry & Dry Cleaning + Self-Service) */}
      <section id="layanan" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold tracking-wider text-[#1D4ED8]">LAYANAN KAMI</p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#082B78] text-balance">
              Layanan Laundry &amp; Dry Cleaning Lengkap
            </h2>
            <div className="mt-3 flex items-center justify-center gap-2" aria-hidden="true">
              <span className="h-0.5 w-16 bg-blue-200 rounded-full" />
              <span className="h-2 w-2 rounded-full bg-[#1D4ED8]" />
              <span className="h-0.5 w-16 bg-blue-200 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {activeServices.slice(0, 8).map((srv) => {
              const Icon = getCategoryIcon(srv.category);
              const isSelfService = srv.model === 'self-service';
              return (
                <article
                  key={srv.id}
                  className={`group rounded-xl bg-white border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden flex flex-col ${
                    isSelfService
                      ? 'border-blue-300 ring-1 ring-blue-100 shadow-sm'
                      : 'border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="relative h-40 bg-blue-50 overflow-hidden">
                    <img
                      src={srv.imageUrl}
                      alt={srv.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="relative px-4 pt-6 pb-4 flex-1 flex flex-col">
                    {/* Overlapping rounded icon matching reference */}
                    <span className="absolute -top-5 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1D4ED8] shadow-md border border-blue-100">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>

                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {srv.name}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed flex-1">
                      {srv.description}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-500">
                        Mulai{' '}
                        <strong className="text-sm font-bold text-[#0B3FA8] tabular-nums">
                          {formatRupiah(srv.priceReguler)}
                        </strong>
                        /{srv.unit}
                      </div>
                      <Link
                        to={`/pesan?service=${srv.id}`}
                        className="text-xs font-bold text-[#1D4ED8] hover:text-[#082B78] inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        Pesan <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/layanan"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-[#0B3FA8] hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              Lihat Semua Detail Layanan
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. LAUNDRY RATE CARD (Kartu Tarif — matches reference split blue card + table) */}
      <section id="tarif" className="py-16 bg-[#F3F8FF] border-y border-blue-100/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white border border-blue-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left promo/title panel */}
            <div className="lg:col-span-4 bg-gradient-to-b from-[#EAF2FF] to-[#DCEBFF] p-7 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold tracking-wider text-[#1D4ED8]">DAFTAR HARGA</p>
                <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#082B78] leading-tight">
                  Kartu Tarif E-Laundry
                </h2>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  Harga jujur tanpa biaya tersembunyi. Express (+{state.settings.pricing.expressMarkupPct}%)
                  selesai 24 jam, Premium (+{state.settings.pricing.premiumMarkupPct}%) selesai hari yang sama.
                </p>
              </div>

              <div className="mt-6 relative">
                <div className="rounded-xl overflow-hidden border border-white/80 shadow-md aspect-[4/3]">
                  <img
                    src={ASSET_IMAGES.homeBedding}
                    alt="Tumpukan handuk dan linen bersih E-Laundry"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-3 -right-2 rounded-full bg-[#1D4ED8] text-white text-center px-3.5 py-2.5 shadow-lg border-2 border-white">
                  <p className="text-[11px] font-extrabold leading-tight">Harga</p>
                  <p className="text-[11px] font-extrabold leading-tight text-amber-300">Terbaik</p>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/kalkulator"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B3FA8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1D4ED8] transition-colors"
                >
                  <Calculator className="h-4 w-4" aria-hidden="true" />
                  Buka Kalkulator Estimasi
                </Link>
              </div>
            </div>

            {/* Right Rate Table */}
            <div className="lg:col-span-8 p-5 sm:p-7 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[520px]">
                <thead>
                  <tr className="bg-[#0B3FA8] text-white">
                    <th className="py-3.5 px-4 text-sm font-bold rounded-tl-xl">Layanan</th>
                    <th className="py-3.5 px-4 text-right text-sm font-bold">
                      Reguler
                      <span className="block text-[11px] font-normal text-blue-200">3 Hari</span>
                    </th>
                    <th className="py-3.5 px-4 text-right text-sm font-bold">
                      Express
                      <span className="block text-[11px] font-normal text-blue-200">
                        24 Jam (+{state.settings.pricing.expressMarkupPct}%)
                      </span>
                    </th>
                    <th className="py-3.5 px-4 text-right text-sm font-bold rounded-tr-xl">
                      Premium
                      <span className="block text-[11px] font-normal text-amber-300">
                        Hari Sama (+{state.settings.pricing.premiumMarkupPct}%)
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {activeServices.map((srv, idx) => (
                    <tr
                      key={srv.id}
                      className={idx % 2 === 1 ? 'bg-blue-50/40' : 'bg-white'}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{srv.name}</p>
                        <p className="text-xs text-slate-500">
                          Satuan: per {srv.unit} ·{' '}
                          {srv.model === 'self-service'
                            ? 'Self-Service'
                            : srv.model === 'hybrid'
                            ? 'Hybrid / Satuan'
                            : 'Full-Service'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800 tabular-nums">
                        {formatRupiah(srv.priceReguler)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#0B3FA8] tabular-nums">
                        {srv.model === 'self-service' ? '—' : formatRupiah(srv.priceExpress)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1D4ED8] tabular-nums">
                        {srv.model === 'self-service' ? '—' : formatRupiah(srv.pricePremium)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-slate-500">
                * Harga dapat menyesuaikan tingkat noda berat atau jenis bahan khusus. Antar-jemput
                gratis mulai transaksi {formatRupiah(state.settings.pricing.freePickupMinOrder)}.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION BARU: LAUNDRY MANDIRI (SELF-SERVICE) + 3 MODEL LAYANAN */}
      <section id="self-service" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-wider text-[#1D4ED8]">
                3 MODEL LAYANAN DALAM SATU SISTEM
              </p>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#082B78] text-balance">
                Laundry Mandiri (Self-Service) &amp; Status Mesin Live
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                Pilih cara mencuci paling sesuai jadwal Anda: cuci sendiri cepat 45 menit, titip
                penuh dengan antar-jemput, atau kombinasi Hybrid cuci sendiri lalu titip setrika.
              </p>
            </div>
            <div className="text-sm font-semibold text-[#0B3FA8] tabular-nums">
              {availableMachinesCount} dari {state.machines.length} mesin sedang tersedia di Cabang Kemang
            </div>
          </div>

          {/* 3 Business Models strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl border border-blue-200 bg-[#F4F8FF] p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B3FA8] text-white">
                  <WashingMachine className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#082B78]">1. Self-Service</h3>
                  <p className="text-xs text-slate-500">Cuci &amp; keringkan sendiri</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Datang langsung, masukkan pakaian ke mesin komersial, bayar per siklus dengan{' '}
                <strong>Token di Kasir</strong> atau <strong>Scan QRIS di mesin</strong>. Tanpa
                antrean produksi, selesai 40 menit.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#0B3FA8]">
                  <Truck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">2. Full-Service</h3>
                  <p className="text-xs text-slate-500">Drop-off / Antar-jemput gratis</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Untuk Anda yang sibuk. Cucian ditimbang, dicuci, dikeringkan, disetrika uap, dan
                diantar kembali oleh staff kami dengan pelacakan status real-time.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Layers className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">3. Hybrid</h3>
                  <p className="text-xs text-slate-500">Cuci mandiri + titip setrika/lipat</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hemat lebih banyak! Cuci &amp; keringkan sendiri di mesin self-service, lalu titip
                jasa setrika uap &amp; lipat rapi di kasir mulai Rp 5.000/kg.
              </p>
            </div>
          </div>

          {/* Live Machine Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.machines.map((machine) => {
              const isAvailable = machine.status === 'Tersedia';
              const isBusy = machine.status === 'Dipakai';
              return (
                <div
                  key={machine.id}
                  data-testid={`machine-card-${machine.code}`}
                  className={`rounded-xl border p-5 flex flex-col justify-between transition-colors ${
                    isAvailable
                      ? 'border-emerald-200 bg-white'
                      : isBusy
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-mono font-semibold text-slate-500">
                          {machine.code} · {machine.type} · Kapasitas {machine.capacityKg} kg
                        </p>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">
                          {machine.name}
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-bold whitespace-nowrap ${
                          isAvailable
                            ? 'text-emerald-700'
                            : isBusy
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {isAvailable ? '● Tersedia' : isBusy ? '● Sedang Dipakai' : '● Perawatan'}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm border-t border-slate-100 pt-3">
                      <span className="text-slate-600">
                        Tarif:{' '}
                        <strong className="font-mono text-[#0B3FA8] tabular-nums">
                          {formatRupiah(machine.pricePerCycle)}
                        </strong>
                        /siklus
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {machine.durationMinutes} mnt
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    {isBusy ? (
                      <div className="flex items-center justify-between rounded-lg bg-amber-100/70 px-3 py-2 text-xs font-semibold text-amber-900">
                        <span>Estimasi selesai dalam</span>
                        <span className="font-mono text-sm tabular-nums">
                          {formatCountdown(machine.remainingSeconds)}
                        </span>
                      </div>
                    ) : isAvailable ? (
                      <Link
                        to={`/pesan?mode=self-service&machine=${machine.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white text-xs font-semibold px-3.5 py-2.5 transition-colors"
                      >
                        Booking Mesin Ini
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    ) : (
                      <div className="rounded-lg bg-rose-100/70 px-3 py-2 text-center text-xs font-semibold text-rose-800">
                        Sedang dalam pengecekan teknisi
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panduan 4 langkah self-service + Cara bayar Token / QRIS */}
          <div className="rounded-2xl bg-[#F4F8FF] border border-blue-100 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-lg font-extrabold text-[#082B78]">
                Panduan 4 Langkah Laundry Mandiri
              </h3>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                {[
                  ['01. Pilih Mesin Kosong', 'Cek ketersediaan mesin di website atau datang langsung ke outlet.'],
                  ['02. Masukkan Pakaian', 'Deterjen & pelembut otomatis terinjeksi di mesin komersial kami.'],
                  ['03. Bayar Token / QRIS', 'Beli token koin di kasir atau scan QRIS langsung di panel mesin.'],
                  ['04. Ambil atau Titip Setrika', 'Selesai 40 menit! Bisa langsung bawa pulang atau titip setrika Hybrid.'],
                ].map(([title, desc]) => (
                  <li key={title} className="rounded-xl bg-white p-3.5 border border-blue-100">
                    <p className="font-bold text-[#0B3FA8]">{title}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{desc}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-base font-bold text-[#082B78]">Metode Bayar Mesin Self-Service</h3>
              <div className="flex items-start gap-3 rounded-xl bg-white p-4 border border-blue-100">
                <Coins className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Token Koin di Kasir</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Bayar tunai atau debit di meja kasir untuk mendapatkan koin token aktivasi mesin.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-white p-4 border border-blue-100">
                <QrCode className="h-5 w-5 text-[#1D4ED8] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Scan QRIS Langsung di Mesin</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Mendukung GoPay, OVO, DANA, ShopeePay, dan m-Banking. Mesin aktif otomatis!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 4 LANGKAH MUDAH (matching reference horizontal 4 cards with blue arrows) */}
      <section id="cara-kerja" className="py-16 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold tracking-wider text-[#1D4ED8]">CARA KERJA</p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#082B78]">
              4 Langkah Mudah di E-Laundry
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {[
              {
                step: 'Langkah 1',
                title: 'Pesan Layanan',
                desc: 'Jadwalkan jemput online atau pilih mesin self-service lewat website dalam 1 menit.',
                icon: CalendarCheck,
              },
              {
                step: 'Langkah 2',
                title: 'Kurir Menjemput',
                desc: 'Kurir kami menjemput cucian langsung ke depan pintu Anda secara gratis.',
                icon: Truck,
              },
              {
                step: 'Langkah 3',
                title: 'Cuci Higienis & Rapi',
                desc: 'Pakaian diproses terpisah per pelanggan dengan deterjen ramah lingkungan.',
                icon: WashingMachine,
              },
              {
                step: 'Langkah 4',
                title: 'Antar Tepat Waktu',
                desc: 'Cucian bersih, wangi, dan terkemas rapi tiba sesuai jadwal yang Anda pilih.',
                icon: ShieldCheck,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative flex items-center">
                  <div className="w-full h-full rounded-xl bg-white border border-blue-100 p-5 shadow-xs flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8]">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#1D4ED8]">{item.step}</p>
                      <h3 className="text-sm font-extrabold text-[#082B78] mt-0.5">{item.title}</h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  {idx < 3 && (
                    <ArrowRight
                      className="hidden lg:block h-5 w-5 text-[#1D4ED8] absolute -right-4 z-10"
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. PROMO BANNER WELCOME20 (matching reference vibrant royal-blue gradient banner) */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#082B78] via-[#0B3FA8] to-[#1D4ED8] text-white p-6 sm:p-10 shadow-xl shadow-blue-900/15 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-balance">
                Dapatkan{' '}
                <span className="text-[#FACC15]">Diskon 20%</span> untuk Pesanan Pertama Anda!
              </h2>
              <p className="text-sm sm:text-base text-blue-100 max-w-xl">
                Berlaku untuk layanan Full-Service, Self-Service, maupun Hybrid (maksimal potongan
                Rp 20.000, minimal belanja Rp 15.000).
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/25 px-4 py-2.5">
                  <span className="text-xs text-blue-100">Gunakan Kode:</span>
                  <span className="font-mono text-sm font-bold tracking-wider text-[#FACC15]">
                    WELCOME20
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPromo}
                    aria-label="Salin kode promo WELCOME20"
                    className="ml-1 rounded-md bg-white/15 hover:bg-white/25 p-1.5 text-white transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <Link
                  to="/pesan?promo=WELCOME20"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#FACC15] hover:bg-yellow-300 text-[#082B78] px-5 py-2.5 text-sm font-extrabold transition-colors whitespace-nowrap"
                >
                  Klaim Diskon Sekarang
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-4 hidden lg:block">
              <div className="rounded-xl overflow-hidden border-2 border-white/25 shadow-lg aspect-[4/3]">
                <img
                  src={ASSET_IMAGES.homeBedding}
                  alt="Keranjang pakaian bersih wangi dengan bunga segar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 5 KEUNGGULAN UTAMA (matching reference 5-item trust strip) */}
      <section className="py-10 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { icon: ShieldCheck, title: '100% Higienis', desc: '1 mesin 1 pelanggan, bebas campur & bakteri' },
              { icon: Clock, title: 'Tepat Waktu', desc: 'Komitmen selesai sesuai estimasi WIB' },
              { icon: Lock, title: 'Aman & Terjamin', desc: 'Pendataan item & foto kondisi awal' },
              { icon: Leaf, title: 'Ramah Lingkungan', desc: 'Deterjen biodegradable lembut di kulit' },
              { icon: ThumbsUp, title: 'Garansi Kepuasan', desc: 'Cuci ulang gratis bila kurang rapi/wangi' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-100">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONI CAROUSEL (matching reference 3-card testimonial carousel) */}
      <section className="py-16 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold tracking-wider text-[#1D4ED8]">TESTIMONI PELANGGAN</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#082B78]">
                Apa Kata Pelanggan Kami
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setTestimonialIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
                }
                aria-label="Testimoni sebelumnya"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length)}
                aria-label="Testimoni berikutnya"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleTestimonials.map((item) => (
              <blockquote
                key={item.id}
                className="rounded-xl bg-white border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3" aria-label="Rating 5 dari 5 bintang">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">“{item.quote}”</p>
                </div>
                <footer className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-[#0B3FA8] font-bold text-sm shrink-0">
                    {item.initials}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.city} · {item.role}
                    </p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ & 10. LOKASI + JAM BUKA */}
      <section id="kontak" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* FAQ Column */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <p className="text-xs font-bold tracking-wider text-[#1D4ED8]">PERTANYAAN UMUM</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#082B78]">
                Sering Ditanyakan (FAQ)
              </h2>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.q} className="bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-bold text-slate-900">{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-[#1D4ED8] shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location & Branches Column */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <p className="text-xs font-bold tracking-wider text-[#1D4ED8]">LOKASI &amp; JAM BUKA</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#082B78]">
                Kunjungi Outlet E-Laundry
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {state.branches.map((branch) => (
                <div
                  key={branch.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2"
                >
                  <p className="text-sm font-bold text-[#082B78]">{branch.name}</p>
                  <p className="text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#1D4ED8] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{branch.address}</span>
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#1D4ED8] shrink-0" aria-hidden="true" />
                    <span>{branch.openHours}</span>
                  </p>
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>{branch.phone}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Clean stylized interactive map visual for Kemang Jakarta Selatan */}
            <div className="rounded-xl border border-blue-200 bg-[#EEF5FF] p-5 relative overflow-hidden">
              <svg
                viewBox="0 0 600 220"
                className="w-full h-44 rounded-lg bg-[#E4EFFC]"
                role="img"
                aria-label="Peta lokasi outlet E-Laundry Jl. Kemang Raya No. 48 Jakarta Selatan"
              >
                <path d="M0 70 L600 50" stroke="#FFFFFF" strokeWidth="14" fill="none" />
                <path d="M0 165 L600 180" stroke="#FFFFFF" strokeWidth="10" fill="none" />
                <path d="M180 0 L220 220" stroke="#FFFFFF" strokeWidth="16" fill="none" />
                <path d="M420 0 L390 220" stroke="#FFFFFF" strokeWidth="12" fill="none" />
                <rect x="40" y="90" width="110" height="55" rx="8" fill="#D5E6FA" />
                <rect x="255" y="88" width="115" height="62" rx="8" fill="#D5E6FA" />
                <rect x="445" y="80" width="120" height="70" rx="8" fill="#D5E6FA" />
                <circle cx="205" cy="112" r="24" fill="#1D4ED8" fillOpacity="0.16" />
                <circle cx="205" cy="112" r="10" fill="#0B3FA8" />
                <circle cx="205" cy="112" r="4" fill="#FACC15" />
                <text x="225" y="106" fill="#082B78" fontSize="13" fontWeight="700">
                  E-Laundry Kemang
                </text>
                <text x="225" y="123" fill="#334155" fontSize="10">
                  Jl. Kemang Raya No. 48 (Parkir Luas)
                </text>
              </svg>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                <span>Radius jemput gratis: Kemang, Cipete, Bangka, Pejaten, Mampang (5 km)</span>
                <Link
                  to="/pesan"
                  className="font-bold text-[#1D4ED8] hover:text-[#082B78] inline-flex items-center gap-1"
                >
                  Jadwalkan Jemput <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
