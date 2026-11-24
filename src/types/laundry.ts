export type ServiceModel = 'full-service' | 'self-service' | 'hybrid';

export type ServiceCategory =
  | 'kiloan'
  | 'satuan'
  | 'self-service'
  | 'dry-cleaning'
  | 'sepatu'
  | 'bedcover'
  | 'express'
  | 'khusus';

export type ServiceUnit = 'kg' | 'item' | 'pasang' | 'siklus';

export type SpeedTier = 'Reguler' | 'Express' | 'Premium';

export type QueueStatus =
  | 'Diterima'
  | 'Dicuci'
  | 'Dikeringkan'
  | 'Disetrika'
  | 'Siap'
  | 'Selesai';

export type PaymentMethod =
  | 'QRIS'
  | 'E-Wallet'
  | 'Virtual Account'
  | 'Tunai'
  | 'Transfer'
  | 'COD';

export type PaymentStatus = 'Lunas' | 'DP' | 'Piutang' | 'Menunggu';

export type UserRole = 'Owner' | 'Admin' | 'Kasir' | 'Operator' | 'Kurir';

export type MembershipTier = 'Reguler' | 'Silver' | 'Gold';

export type MachineType = 'Cuci' | 'Pengering';

export type MachineStatus = 'Tersedia' | 'Dipakai' | 'Rusak';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole | 'Pelanggan';
  branchId: string;
}

export interface Address {
  id: string;
  customerId: string;
  label: string;
  street: string;
  district: string;
  city: string;
  notes?: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  membership: MembershipTier;
  points: number;
  depositBalance: number;
  totalOrders: number;
  joinedAt: string;
  addresses: Address[];
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  model: ServiceModel;
  unit: ServiceUnit;
  priceReguler: number;
  priceExpress: number;
  pricePremium: number;
  description: string;
  estimatedHours: number;
  imageUrl: string;
  active: boolean;
  featured: boolean;
}

export interface AddonOption {
  id: string;
  name: string;
  price: number;
  perUnit: boolean;
  description: string;
}

export interface OrderItem {
  id: string;
  serviceId: string;
  serviceName: string;
  unit: ServiceUnit;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface QueueStatusLog {
  id: string;
  status: QueueStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // Format: LDR-YYYYMMDD-0001
  customerId: string;
  customerName: string;
  customerPhone: string;
  branchId: string;
  model: ServiceModel;
  speed: SpeedTier;
  items: OrderItem[];
  addons: { id: string; name: string; price: number }[];
  subtotal: number;
  promoCode?: string;
  discount: number;
  deliveryFee: number;
  total: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  queueStatus: QueueStatus;
  queueLogs: QueueStatusLog[];
  pickupDelivery: boolean;
  addressText?: string;
  pickupSchedule?: string;
  courierId?: string;
  courierName?: string;
  deliveryState?: 'Menunggu Jemput' | 'Dijemput' | 'Di Outlet' | 'Sedang Diantar' | 'Terkirim';
  notes?: string;
  machineId?: string;
  createdAt: string;
  estimatedFinishAt: string;
}

export interface Machine {
  id: string;
  code: string;
  name: string;
  type: MachineType;
  capacityKg: number;
  pricePerCycle: number;
  durationMinutes: number;
  status: MachineStatus;
  remainingSeconds: number;
  currentCustomer?: string;
  totalCycles: number;
  branchId: string;
}

export interface MachineSession {
  id: string;
  machineId: string;
  machineName: string;
  customerName: string;
  paymentSource: 'Token' | 'QRIS' | 'Booking Online';
  amount: number;
  durationMinutes: number;
  startedAt: string;
  endedAt?: string;
  status: 'Berjalan' | 'Selesai';
}

export interface Token {
  id: string;
  code: string;
  price: number;
  customerName: string;
  soldAt: string;
  usedOnMachineId?: string;
  status: 'Aktif' | 'Terpakai';
}

export interface Payment {
  id: string;
  orderId?: string;
  orderNumber?: string;
  reference: string;
  provider: 'Midtrans' | 'Xendit' | 'Kasir';
  method: PaymentMethod;
  amount: number;
  status: 'Berhasil' | 'Pending' | 'Gagal';
  createdAt: string;
}

export interface Promo {
  id: string;
  code: string;
  title: string;
  type: 'percent' | 'nominal';
  value: number;
  maxDiscount?: number;
  minSpend: number;
  quota: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  firstOrderOnly: boolean;
  applicableModels: ServiceModel[];
  active: boolean;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Listrik' | 'Air' | 'Deterjen & Bahan' | 'Gaji Karyawan' | 'Perawatan Mesin' | 'Lainnya';
  description: string;
  amount: number;
  branchId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number;
  lastRestockedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  branchId: string;
  active: boolean;
  shift: 'Pagi (07:00-15:00)' | 'Sore (14:00-22:00)';
}

export interface NotificationLog {
  id: string;
  channel: 'WhatsApp';
  recipientPhone: string;
  recipientName: string;
  templateKey: 'order_received' | 'in_process' | 'ready_pickup' | 'payment_reminder' | 'promo_blast' | 'otp';
  message: string;
  orderNumber?: string;
  sentAt: string;
  status: 'Terkirim' | 'Antre';
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  openHours: string;
  isMain: boolean;
}

export interface CashierShift {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  cashTotal: number;
  nonCashTotal: number;
  orderCount: number;
  tokenCount: number;
  status: 'Aktif' | 'Ditutup';
}

export interface PricingConfig {
  expressMarkupPct: number; // default 40
  premiumMarkupPct: number; // default 100
  freePickupMinOrder: number;
  standardDeliveryFee: number;
  tokenPrice: number;
}

export interface WhatsAppTemplates {
  order_received: string;
  in_process: string;
  ready_pickup: string;
  payment_reminder: string;
  promo_blast: string;
}

export interface BotSettings {
  enabled: boolean;
  autoReplyPricing: boolean;
  autoReplyTracking: boolean;
  allowChatBooking: boolean;
  greetingMessage: string;
  operatingHoursReply: string;
}

export interface StoreSettings {
  businessName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  openHours: string;
  pricing: PricingConfig;
  templates: WhatsAppTemplates;
  bot: BotSettings;
  integrations: {
    paymentGateway: 'Midtrans Sandbox' | 'Xendit Sandbox';
    whatsappApi: 'Fonnte Mock' | 'Wablas Mock';
    iotMachines: 'MQTT Relay Simulasi (Fase 2)';
    database: 'LocalStorage (Siap Migrasi Supabase/PostgreSQL)';
  };
}

export interface BotMessage {
  id: string;
  sender: 'customer' | 'hermes';
  text: string;
  timestamp: string;
}

export interface LaundryAppState {
  branches: Branch[];
  services: Service[];
  addons: AddonOption[];
  customers: Customer[];
  orders: Order[];
  machines: Machine[];
  machineSessions: MachineSession[];
  tokens: Token[];
  payments: Payment[];
  promos: Promo[];
  expenses: Expense[];
  inventory: InventoryItem[];
  employees: Employee[];
  notifications: NotificationLog[];
  shifts: CashierShift[];
  settings: StoreSettings;
  activeCustomerId: string | null;
}
