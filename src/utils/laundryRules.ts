import type {
  Expense,
  InventoryItem,
  Order,
  Payment,
  PaymentMethod,
  PricingConfig,
  Promo,
  QueueStatus,
  Service,
  ServiceModel,
  SpeedTier,
} from '../types/laundry';

export const QUEUE_STATUS_FLOW: QueueStatus[] = [
  'Diterima',
  'Dicuci',
  'Dikeringkan',
  'Disetrika',
  'Siap',
  'Selesai',
];

export function formatRupiah(amount: number): string {
  const safe = Math.round(Number.isFinite(amount) ? amount : 0);
  const sign = safe < 0 ? '-' : '';
  const absFormatted = Math.abs(safe)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}Rp ${absFormatted}`;
}

export function formatWIB(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${mins} WIB`;
}

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Generates sequential order numbers in strict format: LDR-YYYYMMDD-0001
 */
export function generateOrderNumber(existingOrderNumbers: string[], date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const prefix = `LDR-${yyyy}${mm}${dd}-`;

  let maxSeq = 0;
  for (const num of existingOrderNumbers) {
    if (num.startsWith(prefix)) {
      const seqPart = Number.parseInt(num.slice(prefix.length), 10);
      if (Number.isFinite(seqPart) && seqPart > maxSeq) {
        maxSeq = seqPart;
      }
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `${prefix}${nextSeq}`;
}

export function getSpeedMultiplier(speed: SpeedTier, pricing: PricingConfig): number {
  if (speed === 'Express') {
    return 1 + pricing.expressMarkupPct / 100;
  }
  if (speed === 'Premium') {
    return 1 + pricing.premiumMarkupPct / 100;
  }
  return 1;
}

export function getServiceUnitPrice(
  service: Service,
  speed: SpeedTier,
  pricing: PricingConfig
): number {
  if (service.model === 'self-service') {
    return service.priceReguler;
  }
  if (speed === 'Express') {
    return service.priceExpress > 0
      ? service.priceExpress
      : Math.round(service.priceReguler * getSpeedMultiplier('Express', pricing));
  }
  if (speed === 'Premium') {
    return service.pricePremium > 0
      ? service.pricePremium
      : Math.round(service.priceReguler * getSpeedMultiplier('Premium', pricing));
  }
  return service.priceReguler;
}

export interface PromoValidationResult {
  valid: boolean;
  discount: number;
  promo?: Promo;
  reason?: string;
}

export function validatePromoCode(
  rawCode: string,
  subtotal: number,
  model: ServiceModel,
  promos: Promo[],
  isFirstOrder: boolean = true,
  now: Date = new Date()
): PromoValidationResult {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { valid: false, discount: 0, reason: 'Masukkan kode promo.' };
  }

  const promo = promos.find((p) => p.code.toUpperCase() === code);
  if (!promo || !promo.active) {
    return { valid: false, discount: 0, reason: 'Kode promo tidak ditemukan atau tidak aktif.' };
  }

  const start = new Date(`${promo.startDate}T00:00:00`);
  const end = new Date(`${promo.endDate}T23:59:59`);
  if (now < start || now > end) {
    return { valid: false, discount: 0, reason: 'Periode promo telah berakhir atau belum dimulai.' };
  }

  if (promo.usedCount >= promo.quota) {
    return { valid: false, discount: 0, reason: 'Kuota promo sudah habis.' };
  }

  if (promo.firstOrderOnly && !isFirstOrder) {
    return { valid: false, discount: 0, reason: `Kode ${promo.code} khusus untuk pesanan pertama.` };
  }

  if (!promo.applicableModels.includes(model)) {
    return { valid: false, discount: 0, reason: `Kode ${promo.code} tidak berlaku untuk model layanan ini.` };
  }

  if (subtotal < promo.minSpend) {
    return {
      valid: false,
      discount: 0,
      reason: `Minimal belanja ${formatRupiah(promo.minSpend)} untuk kode ${promo.code}.`,
    };
  }

  let discount = 0;
  if (promo.type === 'percent') {
    discount = Math.round((subtotal * promo.value) / 100);
    if (promo.maxDiscount && discount > promo.maxDiscount) {
      discount = promo.maxDiscount;
    }
  } else {
    discount = promo.value;
  }

  discount = Math.min(discount, subtotal);
  return { valid: true, discount, promo };
}

export interface EstimateCalculationInput {
  service: Service;
  quantity: number;
  speed: SpeedTier;
  addons: { id: string; name: string; price: number; perUnit?: boolean }[];
  pickupDelivery: boolean;
  promoCode?: string;
  isFirstOrder?: boolean;
}

export interface EstimateCalculationResult {
  unitPrice: number;
  serviceSubtotal: number;
  addonsTotal: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  promoResult?: PromoValidationResult;
  total: number;
  estimatedHours: number;
}

export function calculateEstimate(
  input: EstimateCalculationInput,
  promos: Promo[],
  pricing: PricingConfig,
  now: Date = new Date()
): EstimateCalculationResult {
  const safeQty = Math.max(1, Number.isFinite(input.quantity) ? input.quantity : 1);
  const unitPrice = getServiceUnitPrice(input.service, input.speed, pricing);
  const serviceSubtotal = Math.round(unitPrice * safeQty);

  const addonsTotal = input.addons.reduce((sum, addon) => {
    const lineCost = addon.perUnit ? addon.price * safeQty : addon.price;
    return sum + Math.round(lineCost);
  }, 0);

  const subtotal = serviceSubtotal + addonsTotal;

  const deliveryFee =
    input.pickupDelivery && input.service.model !== 'self-service'
      ? subtotal >= pricing.freePickupMinOrder
        ? 0
        : pricing.standardDeliveryFee
      : 0;

  let discount = 0;
  let promoResult: PromoValidationResult | undefined;

  if (input.promoCode && input.promoCode.trim().length > 0) {
    promoResult = validatePromoCode(
      input.promoCode,
      subtotal,
      input.service.model,
      promos,
      input.isFirstOrder ?? true,
      now
    );
    if (promoResult.valid) {
      discount = promoResult.discount;
    }
  }

  const total = Math.max(0, subtotal + deliveryFee - discount);

  let estimatedHours = input.service.estimatedHours;
  if (input.service.model !== 'self-service') {
    if (input.speed === 'Express') estimatedHours = 24;
    if (input.speed === 'Premium') estimatedHours = 6;
  }

  return {
    unitPrice,
    serviceSubtotal,
    addonsTotal,
    subtotal,
    deliveryFee,
    discount,
    promoResult,
    total,
    estimatedHours,
  };
}

export function getNextQueueStatus(current: QueueStatus): QueueStatus | null {
  const idx = QUEUE_STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= QUEUE_STATUS_FLOW.length - 1) return null;
  return QUEUE_STATUS_FLOW[idx + 1];
}

export function isOrderInProductionQueue(order: Pick<Order, 'model' | 'queueStatus'>): boolean {
  // Pure self-service pays per cycle without production queue
  if (order.model === 'self-service') return false;
  return order.queueStatus !== 'Selesai';
}

export function getLowStockItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter((item) => item.stock <= item.minStock);
}

export interface FinancialSummary {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  totalExpenses: number;
  netProfit: number;
  byPaymentMethod: Record<PaymentMethod, number>;
  cashTotal: number;
  nonCashTotal: number;
  unpaidReceivables: number;
}

export function computeFinancialSummary(
  orders: Order[],
  expenses: Expense[],
  payments: Payment[],
  referenceDate: Date = new Date()
): FinancialSummary {
  const todayStr = referenceDate.toISOString().slice(0, 10);
  const monthStr = referenceDate.toISOString().slice(0, 7);

  const byPaymentMethod: Record<PaymentMethod, number> = {
    QRIS: 0,
    'E-Wallet': 0,
    'Virtual Account': 0,
    Tunai: 0,
    Transfer: 0,
    COD: 0,
  };

  let totalRevenue = 0;
  let todayRevenue = 0;
  let monthRevenue = 0;
  let unpaidReceivables = 0;

  for (const order of orders) {
    const paid = order.paidAmount;
    totalRevenue += paid;
    if (order.createdAt.slice(0, 10) === todayStr) {
      todayRevenue += paid;
    }
    if (order.createdAt.slice(0, 7) === monthStr) {
      monthRevenue += paid;
    }
    if (order.total > order.paidAmount) {
      unpaidReceivables += order.total - order.paidAmount;
    }
    byPaymentMethod[order.paymentMethod] = (byPaymentMethod[order.paymentMethod] ?? 0) + paid;
  }

  // Also include standalone token payments not linked to an order
  for (const payment of payments) {
    if (!payment.orderId && payment.status === 'Berhasil') {
      totalRevenue += payment.amount;
      if (payment.createdAt.slice(0, 10) === todayStr) {
        todayRevenue += payment.amount;
      }
      if (payment.createdAt.slice(0, 7) === monthStr) {
        monthRevenue += payment.amount;
      }
      byPaymentMethod[payment.method] = (byPaymentMethod[payment.method] ?? 0) + payment.amount;
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cashTotal = byPaymentMethod.Tunai + byPaymentMethod.COD;
  const nonCashTotal =
    byPaymentMethod.QRIS +
    byPaymentMethod['E-Wallet'] +
    byPaymentMethod['Virtual Account'] +
    byPaymentMethod.Transfer;

  return {
    totalRevenue,
    todayRevenue,
    monthRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    byPaymentMethod,
    cashTotal,
    nonCashTotal,
    unpaidReceivables,
  };
}

export function generateCsvContent(headers: string[], rows: (string | number)[][]): string {
  const escape = (val: string | number): string => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  return [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}
