import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEstimate,
  computeFinancialSummary,
  formatRupiah,
  generateCsvContent,
  generateOrderNumber,
  getLowStockItems,
  getNextQueueStatus,
  getSpeedMultiplier,
  isOrderInProductionQueue,
  validatePromoCode,
} from './laundryRules';
import type { Expense, InventoryItem, Order, PricingConfig, Promo, Service } from '../types/laundry';

const samplePricing: PricingConfig = {
  expressMarkupPct: 40,
  premiumMarkupPct: 100,
  freePickupMinOrder: 30000,
  standardDeliveryFee: 8000,
  tokenPrice: 20000,
};

const sampleKiloanService: Service = {
  id: 'srv-kiloan',
  name: 'Cuci & Lipat Kiloan',
  category: 'kiloan',
  model: 'full-service',
  unit: 'kg',
  priceReguler: 7000,
  priceExpress: 9800,
  pricePremium: 14000,
  description: 'Cuci bersih & lipat rapi',
  estimatedHours: 72,
  imageUrl: '/src/assets/images/service_wash_fold_1795485219765.jpg',
  active: true,
  featured: true,
};

const sampleSelfService: Service = {
  id: 'srv-self',
  name: 'Self-Service Cuci + Kering',
  category: 'self-service',
  model: 'self-service',
  unit: 'siklus',
  priceReguler: 20000,
  priceExpress: 20000,
  pricePremium: 20000,
  description: 'Cuci & kering mandiri',
  estimatedHours: 1,
  imageUrl: '/src/assets/images/service_self_laundromat_1795485218752.jpg',
  active: true,
  featured: true,
};

const samplePromos: Promo[] = [
  {
    id: 'prm-1',
    code: 'WELCOME20',
    title: 'Diskon 20% Order Pertama',
    type: 'percent',
    value: 20,
    maxDiscount: 20000,
    minSpend: 15000,
    quota: 100,
    usedCount: 10,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    firstOrderOnly: true,
    applicableModels: ['full-service', 'hybrid', 'self-service'],
    active: true,
  },
  {
    id: 'prm-2',
    code: 'HEMAT15K',
    title: 'Potongan Rp 15.000',
    type: 'nominal',
    value: 15000,
    minSpend: 75000,
    quota: 50,
    usedCount: 50,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    firstOrderOnly: false,
    applicableModels: ['full-service', 'hybrid'],
    active: true,
  },
];

test('formatRupiah formats Indonesian currency accurately', () => {
  assert.equal(formatRupiah(0), 'Rp 0');
  assert.equal(formatRupiah(7000), 'Rp 7.000');
  assert.equal(formatRupiah(1250000), 'Rp 1.250.000');
  assert.equal(formatRupiah(-15000), '-Rp 15.000');
});

test('generateOrderNumber follows LDR-YYYYMMDD-0001 sequential format', () => {
  const refDate = new Date('2026-11-23T10:00:00Z');
  assert.equal(generateOrderNumber([], refDate), 'LDR-20261123-0001');
  assert.equal(
    generateOrderNumber(['LDR-20261123-0001', 'LDR-20261123-0004', 'LDR-20261122-0099'], refDate),
    'LDR-20261123-0005'
  );
});

test('speed multipliers apply +40% for Express and +100% for Premium', () => {
  assert.equal(getSpeedMultiplier('Reguler', samplePricing), 1);
  assert.equal(getSpeedMultiplier('Express', samplePricing), 1.4);
  assert.equal(getSpeedMultiplier('Premium', samplePricing), 2);
});

test('WELCOME20 applies 20% discount capped at Rp 20.000 for first order', () => {
  const now = new Date('2026-11-23T12:00:00Z');
  // 20% of 50.000 = 10.000
  const res1 = validatePromoCode('welcome20', 50000, 'full-service', samplePromos, true, now);
  assert.equal(res1.valid, true);
  assert.equal(res1.discount, 10000);

  // 20% of 150.000 = 30.000 -> capped at 20.000
  const res2 = validatePromoCode('WELCOME20', 150000, 'full-service', samplePromos, true, now);
  assert.equal(res2.valid, true);
  assert.equal(res2.discount, 20000);

  // Reject repeat customer for first-order promo
  const res3 = validatePromoCode('WELCOME20', 50000, 'full-service', samplePromos, false, now);
  assert.equal(res3.valid, false);
  assert.equal(res3.discount, 0);

  // Reject exhausted quota
  const res4 = validatePromoCode('HEMAT15K', 100000, 'full-service', samplePromos, true, now);
  assert.equal(res4.valid, false);
});

test('calculateEstimate computes Express price, add-ons, free delivery threshold, and WELCOME20', () => {
  const now = new Date('2026-11-23T12:00:00Z');
  const estimate = calculateEstimate(
    {
      service: sampleKiloanService,
      quantity: 5,
      speed: 'Express',
      addons: [{ id: 'add-parfum', name: 'Pewangi Premium', price: 3000, perUnit: true }],
      pickupDelivery: true,
      promoCode: 'WELCOME20',
      isFirstOrder: true,
    },
    samplePromos,
    samplePricing,
    now
  );

  // 5kg * Rp 9.800 = 49.000; addons 5 * 3.000 = 15.000; subtotal = 64.000
  // subtotal >= 30.000 -> deliveryFee = 0
  // WELCOME20 = 20% of 64.000 = 12.800
  // total = 51.200
  assert.equal(estimate.serviceSubtotal, 49000);
  assert.equal(estimate.addonsTotal, 15000);
  assert.equal(estimate.subtotal, 64000);
  assert.equal(estimate.deliveryFee, 0);
  assert.equal(estimate.discount, 12800);
  assert.equal(estimate.total, 51200);
  assert.equal(estimate.estimatedHours, 24);
});

test('self-service bypasses production queue and has no delivery fee', () => {
  assert.equal(isOrderInProductionQueue({ model: 'self-service', queueStatus: 'Diterima' }), false);
  assert.equal(isOrderInProductionQueue({ model: 'full-service', queueStatus: 'Dicuci' }), true);
  assert.equal(isOrderInProductionQueue({ model: 'hybrid', queueStatus: 'Selesai' }), false);

  const estimate = calculateEstimate(
    {
      service: sampleSelfService,
      quantity: 1,
      speed: 'Premium',
      addons: [],
      pickupDelivery: true,
    },
    samplePromos,
    samplePricing
  );
  assert.equal(estimate.total, 20000);
  assert.equal(estimate.deliveryFee, 0);
});

test('queue status state machine advances sequentially', () => {
  assert.equal(getNextQueueStatus('Diterima'), 'Dicuci');
  assert.equal(getNextQueueStatus('Dicuci'), 'Dikeringkan');
  assert.equal(getNextQueueStatus('Siap'), 'Selesai');
  assert.equal(getNextQueueStatus('Selesai'), null);
});

test('computeFinancialSummary and low-stock detection calculate accurately', () => {
  const refDate = new Date('2026-11-23T12:00:00Z');
  const orders: Order[] = [
    {
      id: 'o1',
      orderNumber: 'LDR-20261123-0001',
      customerId: 'c1',
      customerName: 'Rina',
      customerPhone: '+6281234567890',
      branchId: 'b1',
      model: 'full-service',
      speed: 'Reguler',
      items: [],
      addons: [],
      subtotal: 50000,
      discount: 0,
      deliveryFee: 0,
      total: 50000,
      paidAmount: 50000,
      paymentMethod: 'QRIS',
      paymentStatus: 'Lunas',
      queueStatus: 'Dicuci',
      queueLogs: [],
      pickupDelivery: true,
      createdAt: '2026-11-23T09:00:00Z',
      estimatedFinishAt: '2026-11-26T09:00:00Z',
    },
    {
      id: 'o2',
      orderNumber: 'LDR-20261123-0002',
      customerId: 'c2',
      customerName: 'Budi',
      customerPhone: '+6281299998888',
      branchId: 'b1',
      model: 'hybrid',
      speed: 'Express',
      items: [],
      addons: [],
      subtotal: 40000,
      discount: 0,
      deliveryFee: 0,
      total: 40000,
      paidAmount: 20000,
      paymentMethod: 'Tunai',
      paymentStatus: 'DP',
      queueStatus: 'Disetrika',
      queueLogs: [],
      pickupDelivery: false,
      createdAt: '2026-11-23T10:00:00Z',
      estimatedFinishAt: '2026-11-24T10:00:00Z',
    },
  ];
  const expenses: Expense[] = [
    { id: 'e1', date: '2026-11-20', category: 'Listrik', description: 'PLN', amount: 30000, branchId: 'b1' },
  ];

  const report = computeFinancialSummary(orders, expenses, [], refDate);
  assert.equal(report.totalRevenue, 70000);
  assert.equal(report.todayRevenue, 70000);
  assert.equal(report.cashTotal, 20000);
  assert.equal(report.nonCashTotal, 50000);
  assert.equal(report.unpaidReceivables, 20000);
  assert.equal(report.netProfit, 40000);

  const inventory: InventoryItem[] = [
    { id: 'i1', name: 'Deterjen', sku: 'DET-1', unit: 'Liter', stock: 4, minStock: 10, costPerUnit: 25000, lastRestockedAt: '2026-11-01' },
    { id: 'i2', name: 'Plastik', sku: 'PLS-1', unit: 'Roll', stock: 18, minStock: 5, costPerUnit: 15000, lastRestockedAt: '2026-11-01' },
  ];
  assert.equal(getLowStockItems(inventory).length, 1);
  assert.equal(getLowStockItems(inventory)[0].id, 'i1');

  const csv = generateCsvContent(['Order', 'Total'], [['LDR-20261123-0001', 50000]]);
  assert.equal(csv, 'Order,Total\nLDR-20261123-0001,50000');
});
