import React, { useState } from 'react';
import { Bot, Send, RotateCcw, Save, MessageCircle, Database, CreditCard, Cpu } from 'lucide-react';
import { useLaundry } from '../../context/LaundryContext';
import { processHermesBotMessage } from '../../services/integrations';
import { formatWIB } from '../../utils/laundryRules';
import type { BotMessage } from '../../types/laundry';

/* ---------------- 1. HERMES AGENT WHATSAPP BOT ---------------- */
export const AdminHermesBotSection: React.FC = () => {
  const { state, updateSettings, createOrder } = useLaundry();
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: 'bm-init',
      sender: 'hermes',
      text: state.settings.bot.greetingMessage,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingOrderDraft, setPendingOrderDraft] = useState<{
    serviceId: string;
    quantity: number;
  } | null>(null);

  const sendMessage = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg: BotMessage = {
      id: `bm-u-${Date.now()}`,
      sender: 'customer',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const reply = processHermesBotMessage(trimmed, state, state.settings.bot);
    const botMsg: BotMessage = {
      id: `bm-h-${Date.now() + 1}`,
      sender: 'hermes',
      text: reply.replyText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setPendingOrderDraft(reply.suggestedQuickOrder ?? null);
    setInput('');
  };

  const handleConfirmBotOrder = async () => {
    if (!pendingOrderDraft) return;
    const srv = state.services.find((s) => s.id === pendingOrderDraft.serviceId) ?? state.services[0];
    const subtotal = srv.priceReguler * pendingOrderDraft.quantity;
    const created = await createOrder({
      customerName: 'Pelanggan WhatsApp (Hermes)',
      customerPhone: '+6281290001234',
      model: srv.model,
      speed: 'Reguler',
      items: [
        {
          id: `oi-bot-${Date.now()}`,
          serviceId: srv.id,
          serviceName: srv.name,
          unit: srv.unit,
          quantity: pendingOrderDraft.quantity,
          unitPrice: srv.priceReguler,
          subtotal,
        },
      ],
      addons: [],
      subtotal,
      discount: 0,
      deliveryFee: 0,
      total: subtotal,
      paidAmount: 0,
      paymentMethod: 'COD',
      paymentStatus: 'Menunggu',
      pickupDelivery: true,
      addressText: 'Via Chat WhatsApp Hermes Agent (Alamat dikonfirmasi kurir)',
      actorName: 'Hermes Agent Bot',
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `bm-ok-${Date.now()}`,
        sender: 'hermes',
        text: `Order berhasil dibuat! Nomor Nota Anda: ${created.orderNumber}. Kurir kami akan segera menghubungi Anda via WhatsApp.`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setPendingOrderDraft(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Live Chat Simulator */}
      <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs flex flex-col">
        <div className="bg-[#082B78] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FACC15] text-[#082B78]">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold">Simulasi Chat Bot “Hermes Agent”</h2>
              <p className="text-[11px] text-blue-200">
                Terhubung langsung ke data order, tarif, &amp; mesin E-Laundry
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-300">
            {state.settings.bot.enabled ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>

        {/* Quick Prompt Suggestions */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500">Coba cepat:</span>
          {[
            'Cek status LDR-20261123-0001',
            'Tarif laundry',
            'Status mesin self-service',
            'Jam buka outlet',
            'Pesan kiloan 5kg',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0B3FA8] hover:bg-blue-50 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="p-4 space-y-3 h-96 overflow-y-auto bg-[#F4F8FF]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-line leading-relaxed shadow-xs ${
                  msg.sender === 'customer'
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        {pendingOrderDraft && (
          <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-emerald-900">
              Draf order dari chat siap diteruskan ke antrean POS!
            </span>
            <button
              type="button"
              onClick={handleConfirmBotOrder}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold cursor-pointer"
            >
              Konfirmasi Buat Order dari Chat
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            aria-label="Ketik pesan simulasi WhatsApp"
            placeholder="Ketik nomor nota, tarif, jam buka, atau pesan kiloan 6kg..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-[#1D4ED8] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Kirim pesan ke Hermes Agent"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B3FA8] hover:bg-[#1D4ED8] text-white px-4 py-2.5 text-xs font-bold cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" /> Kirim
          </button>
        </form>
      </div>

      {/* Bot Behavior Settings */}
      <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-extrabold text-[#082B78]">Pengaturan Perilaku Hermes Agent</h3>

        <div className="space-y-3 text-xs">
          {(
            [
              ['enabled', 'Aktifkan Bot WhatsApp Otomatis'],
              ['autoReplyPricing', 'Balas Otomatis Pertanyaan Tarif & Promo'],
              ['autoReplyTracking', 'Cek Status Cucian via Nomor Nota (LDR-...)'],
              ['allowChatBooking', 'Terima Pemesanan Langsung Lewat Chat'],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50"
            >
              <span className="font-semibold text-slate-800">{label}</span>
              <input
                type="checkbox"
                checked={state.settings.bot[key]}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    bot: { ...prev.bot, [key]: e.target.checked },
                  }))
                }
                className="h-4 w-4 accent-[#1D4ED8]"
              />
            </label>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">Balasan Jam Buka &amp; Lokasi</label>
          <textarea
            rows={3}
            value={state.settings.bot.operatingHoursReply}
            onChange={(e) =>
              updateSettings((prev) => ({
                ...prev,
                bot: { ...prev.bot, operatingHoursReply: e.target.value },
              }))
            }
            className="w-full rounded-xl border border-slate-300 p-3 text-xs"
          />
        </div>
      </div>
    </div>
  );
};

/* ---------------- 2. PENGATURAN, TEMPLATE WA & INTEGRASI ---------------- */
export const AdminSettingsSection: React.FC = () => {
  const { state, updateSettings, resetDemoData } = useLaundry();
  const [phone, setPhone] = useState(state.settings.phone);
  const [address, setAddress] = useState(state.settings.address);
  const [openHours, setOpenHours] = useState(state.settings.openHours);
  const [tplReceived, setTplReceived] = useState(state.settings.templates.order_received);
  const [tplReady, setTplReady] = useState(state.settings.templates.ready_pickup);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings((prev) => ({
      ...prev,
      phone,
      whatsapp: phone,
      address,
      openHours,
      templates: {
        ...prev.templates,
        order_received: tplReceived,
        ready_pickup: tplReady,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSave}
        className="rounded-xl bg-white border border-slate-200 p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-[#082B78]">
              Profil Usaha &amp; Template Notifikasi WhatsApp
            </h2>
            <p className="text-xs text-slate-500">
              Perubahan profil dan jam buka langsung tampil pada Website Publik &amp; Struk 58mm.
            </p>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#0B3FA8] text-white px-4 py-2 text-xs font-bold cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" /> Simpan Pengaturan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Telepon / WhatsApp (+62)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Jam Operasional (WIB)</label>
            <input
              type="text"
              value={openHours}
              onChange={(e) => setOpenHours(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Outlet Utama</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Template WA: Order Diterima
            </label>
            <textarea
              rows={3}
              value={tplReceived}
              onChange={(e) => setTplReceived(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Template WA: Cucian Siap Diambil / Diantar
            </label>
            <textarea
              rows={3}
              value={tplReady}
              onChange={(e) => setTplReady(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3 text-xs"
            />
          </div>
        </div>
      </form>

      {/* Integration Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Database,
            title: 'Database Layer',
            value: state.settings.integrations.database,
            desc: 'Interface DataRepository siap migrasi 1-file ke Supabase / PostgreSQL.',
          },
          {
            icon: CreditCard,
            title: 'Payment Gateway',
            value: state.settings.integrations.paymentGateway,
            desc: 'PaymentService (createPayment & checkStatus) mendukung QRIS, E-Wallet, VA.',
          },
          {
            icon: MessageCircle,
            title: 'WhatsApp API',
            value: state.settings.integrations.whatsappApi,
            desc: 'NotificationService dengan 5 template otomatis & log pengiriman.',
          },
          {
            icon: Cpu,
            title: 'IoT Mesin (Fase 2)',
            value: state.settings.integrations.iotMachines,
            desc: 'MachineService (startMachine & getStatus) terintegrasi countdown live.',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#0B3FA8]">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <h3 className="text-xs font-extrabold">{item.title}</h3>
              </div>
              <p className="text-xs font-mono font-bold text-emerald-700">{item.value}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Recent WhatsApp Log + Reset */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            Log Terakhir ({state.notifications.length} pesan WhatsApp tercatat)
          </h3>
          {state.notifications[0] && (
            <p className="text-xs text-slate-500 mt-0.5">
              Terbaru: {state.notifications[0].recipientName} · {formatWIB(state.notifications[0].sentAt)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={resetDemoData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 px-3.5 py-2 text-xs font-bold cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset Data Demo
        </button>
      </div>
    </div>
  );
};
