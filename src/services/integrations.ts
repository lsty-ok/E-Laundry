import type {
  BotSettings,
  LaundryAppState,
  Machine,
  NotificationLog,
  Payment,
  PaymentMethod,
} from '../types/laundry';
import { formatRupiah, formatWIB } from '../utils/laundryRules';

const STORAGE_KEY = 'elaundry_umkm_state_v1';

/**
 * DataRepository interface — swap localStorage implementation with Supabase/PostgreSQL client
 * without modifying UI components.
 */
export interface IDataRepository {
  loadState(): LaundryAppState | null;
  saveState(state: LaundryAppState): void;
  clearState(): void;
}

export const localDataRepository: IDataRepository = {
  loadState(): LaundryAppState | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as LaundryAppState;
    } catch {
      return null;
    }
  },
  saveState(state: LaundryAppState): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors in restricted sandboxes
    }
  },
  clearState(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};

/**
 * PaymentService interface — ready for Midtrans Snap / Xendit Invoice API
 */
export interface CreatePaymentInput {
  orderId?: string;
  orderNumber?: string;
  amount: number;
  method: PaymentMethod;
  provider?: 'Midtrans' | 'Xendit' | 'Kasir';
}

export interface IPaymentService {
  createPayment(input: CreatePaymentInput): Promise<Payment & { qrisPayload?: string; vaNumber?: string }>;
  checkStatus(reference: string, existingPayments: Payment[]): Promise<'Berhasil' | 'Pending' | 'Gagal'>;
}

export const paymentService: IPaymentService = {
  async createPayment(input) {
    const provider =
      input.provider ??
      (input.method === 'Tunai' || input.method === 'COD'
        ? 'Kasir'
        : input.method === 'Virtual Account'
        ? 'Xendit'
        : 'Midtrans');

    const refPrefix = provider === 'Midtrans' ? 'MID' : provider === 'Xendit' ? 'XND' : 'KSR';
    const reference = `${refPrefix}-${Date.now().toString().slice(-6)}`;
    const status = input.method === 'COD' ? 'Pending' : 'Berhasil';

    return {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      reference,
      provider,
      method: input.method,
      amount: input.amount,
      status,
      createdAt: new Date().toISOString(),
      qrisPayload:
        input.method === 'QRIS'
          ? `00020101021226580014ID.ELAUNDRY.WWW0118${reference}5405${input.amount}5802ID`
          : undefined,
      vaNumber:
        input.method === 'Virtual Account' ? `88012${Math.floor(100000000 + Math.random() * 900000000)}` : undefined,
    };
  },

  async checkStatus(reference, existingPayments) {
    const match = existingPayments.find((p) => p.reference === reference);
    return match ? match.status : 'Pending';
  },
};

/**
 * NotificationService interface — ready for Fonnte / Wablas / Official WhatsApp Cloud API
 */
export interface INotificationService {
  renderTemplate(template: string, vars: Record<string, string>): string;
  createWhatsAppLog(params: {
    recipientPhone: string;
    recipientName: string;
    templateKey: NotificationLog['templateKey'];
    message: string;
    orderNumber?: string;
  }): NotificationLog;
}

export const notificationService: INotificationService = {
  renderTemplate(template, vars) {
    return Object.entries(vars).reduce(
      (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
      template
    );
  },

  createWhatsAppLog({ recipientPhone, recipientName, templateKey, message, orderNumber }) {
    return {
      id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channel: 'WhatsApp',
      recipientPhone,
      recipientName,
      templateKey,
      message,
      orderNumber,
      sentAt: new Date().toISOString(),
      status: 'Terkirim',
    };
  },
};

/**
 * MachineService interface — Phase 2 IoT Relay Control (MQTT / REST)
 */
export interface IMachineService {
  startMachine(machine: Machine, durationMinutes: number, customerName: string): Machine;
  stopMachine(machine: Machine): Machine;
  getStatus(machineId: string, machines: Machine[]): Machine | undefined;
}

export const machineService: IMachineService = {
  startMachine(machine, durationMinutes, customerName) {
    return {
      ...machine,
      status: 'Dipakai',
      remainingSeconds: Math.max(1, durationMinutes) * 60,
      currentCustomer: customerName,
      totalCycles: machine.totalCycles + 1,
    };
  },
  stopMachine(machine) {
    return {
      ...machine,
      status: 'Tersedia',
      remainingSeconds: 0,
      currentCustomer: undefined,
    };
  },
  getStatus(machineId, machines) {
    return machines.find((m) => m.id === machineId);
  },
};

/**
 * Hermes Agent WhatsApp Bot — simulated intelligent assistant querying live store data
 */
export interface HermesReplyResult {
  replyText: string;
  suggestedQuickOrder?: {
    serviceId: string;
    quantity: number;
  };
}

export function processHermesBotMessage(
  rawInput: string,
  state: LaundryAppState,
  botSettings: BotSettings
): HermesReplyResult {
  const input = rawInput.trim();
  const lower = input.toLowerCase();

  if (!botSettings.enabled) {
    return {
      replyText:
        'Bot Hermes Agent sedang nonaktif. Pesan Anda telah diteruskan ke Customer Support E-Laundry (+62 812-8800-4321).',
    };
  }

  // 1. Check Order Status by LDR-YYYYMMDD-XXXX
  const orderMatch = input.toUpperCase().match(/LDR-\d{8}-\d{4}/);
  if (orderMatch && botSettings.autoReplyTracking) {
    const orderNum = orderMatch[0];
    const order = state.orders.find((o) => o.orderNumber === orderNum);
    if (order) {
      return {
        replyText: `Status Pesanan ${order.orderNumber}\n• Pelanggan: ${order.customerName}\n• Status Antrean: ${order.queueStatus.toUpperCase()}\n• Total: ${formatRupiah(order.total)} (${order.paymentStatus})\n• Estimasi Selesai: ${formatWIB(order.estimatedFinishAt)}\nTerima kasih telah mempercayakan cucian Anda kepada E-Laundry!`,
      };
    }
    return {
      replyText: `Maaf, nomor nota ${orderNum} belum ditemukan di sistem E-Laundry. Pastikan formatnya benar (contoh: LDR-20261123-0001).`,
    };
  }

  // 2. Check Live Self-Service Machines
  if (lower.includes('mesin') || lower.includes('self') || lower.includes('mandiri')) {
    const available = state.machines.filter((m) => m.status === 'Tersedia');
    const busy = state.machines.filter((m) => m.status === 'Dipakai');
    const listText = state.machines
      .map((m) => {
        const extra =
          m.status === 'Dipakai'
            ? `Dipakai (sisa ~${Math.ceil(m.remainingSeconds / 60)} menit)`
            : m.status;
        return `• ${m.name} (${m.capacityKg}kg) — ${formatRupiah(m.pricePerCycle)}/siklus [${extra}]`;
      })
      .join('\n');
    return {
      replyText: `Info Mesin Self-Service E-Laundry Kemang saat ini:\nTersedia: ${available.length} mesin | Sedang Dipakai: ${busy.length} mesin\n\n${listText}\n\nPembayaran bisa pakai Token di kasir atau scan QRIS langsung di mesin.`,
    };
  }

  // 3. Pricing / Tarif inquiry
  if (lower.includes('tarif') || lower.includes('harga') || lower.includes('biaya')) {
    if (!botSettings.autoReplyPricing) {
      return {
        replyText: 'Silakan cek halaman Tarif & Kalkulator di website E-Laundry untuk rincian biaya terbaru.',
      };
    }
    const rows = state.services
      .filter((s) => s.active)
      .slice(0, 6)
      .map(
        (s) =>
          `• ${s.name}: ${formatRupiah(s.priceReguler)}/${s.unit} (Express: ${formatRupiah(s.priceExpress)})`
      )
      .join('\n');
    return {
      replyText: `Daftar Tarif E-Laundry Terbaru:\n${rows}\n\nGunakan kode promo WELCOME20 untuk diskon 20% (maks Rp 20.000) khusus order pertama!`,
    };
  }

  // 4. Operating Hours / Lokasi
  if (lower.includes('jam') || lower.includes('buka') || lower.includes('lokasi') || lower.includes('alamat')) {
    return {
      replyText: `${botSettings.operatingHoursReply}\nAlamat utama: ${state.settings.address}.`,
    };
  }

  // 5. Promo inquiry
  if (lower.includes('promo') || lower.includes('diskon')) {
    const activePromos = state.promos
      .filter((p) => p.active)
      .map((p) => `• ${p.code}: ${p.title} (min. ${formatRupiah(p.minSpend)})`)
      .join('\n');
    return {
      replyText: `Promo aktif E-Laundry saat ini:\n${activePromos}`,
    };
  }

  // 6. Quick Chat Order creation
  if (lower.includes('pesan') || lower.includes('order') || lower.includes('jemput')) {
    if (!botSettings.allowChatBooking) {
      return {
        replyText: 'Pemesanan via chat sedang dinonaktifkan. Silakan pesan langsung melalui menu Pesan Jemput di website.',
      };
    }
    const kgMatch = lower.match(/(\d+)\s*kg/);
    const qty = kgMatch ? Math.max(1, Number.parseInt(kgMatch[1], 10)) : 4;
    const kiloan = state.services.find((s) => s.category === 'kiloan') ?? state.services[0];
    return {
      replyText: `Siap! Hermes Agent telah menyiapkan draf pesanan ${kiloan.name} (${qty} ${kiloan.unit}) — estimasi ${formatRupiah(kiloan.priceReguler * qty)}. Klik tombol "Konfirmasi Buat Order dari Chat" di bawah untuk langsung masuk ke antrean POS!`,
      suggestedQuickOrder: {
        serviceId: kiloan.id,
        quantity: qty,
      },
    };
  }

  return {
    replyText: botSettings.greetingMessage,
  };
}
