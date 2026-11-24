import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createInitialSeedState } from '../data/seedData';
import {
  localDataRepository,
  machineService,
  notificationService,
  paymentService,
} from '../services/integrations';
import type {
  Address,
  CashierShift,
  Customer,
  Employee,
  Expense,
  InventoryItem,
  LaundryAppState,
  Machine,
  Order,
  OrderItem,
  PaymentMethod,
  PaymentStatus,
  Promo,
  QueueStatus,
  Service,
  ServiceModel,
  SpeedTier,
  StoreSettings,
} from '../types/laundry';
import { formatRupiah, formatWIB, generateOrderNumber } from '../utils/laundryRules';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'info' | 'warning';
}

export interface CreateOrderPayload {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  branchId?: string;
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
  pickupDelivery: boolean;
  addressText?: string;
  pickupSchedule?: string;
  notes?: string;
  machineId?: string;
  actorName?: string;
}

interface LaundryContextValue {
  state: LaundryAppState;
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
  resetDemoData: () => void;

  // Orders & Queue
  createOrder: (payload: CreateOrderPayload) => Promise<Order>;
  updateOrderQueueStatus: (orderId: string, newStatus: QueueStatus, actorName?: string) => void;
  settleOrderPayment: (orderId: string, method: PaymentMethod) => void;
  assignCourierToOrder: (
    orderId: string,
    courierId: string,
    deliveryState: NonNullable<Order['deliveryState']>
  ) => void;

  // Self-service Machines & Tokens
  sellTokenAndActivateMachine: (params: {
    machineId: string;
    customerName: string;
    paymentSource: 'Token' | 'QRIS' | 'Booking Online';
  }) => void;
  stopMachineSession: (machineId: string) => void;
  saveMachine: (machine: Omit<Machine, 'id'> & { id?: string }) => void;
  deleteMachine: (machineId: string) => void;

  // Customer Portal & Auth
  loginCustomerByPhone: (phone: string, nameIfNew?: string) => Customer;
  logoutCustomer: () => void;
  addCustomerAddress: (customerId: string, address: Omit<Address, 'id' | 'customerId'>) => void;
  deleteCustomerAddress: (customerId: string, addressId: string) => void;
  upsertCustomer: (customer: Partial<Customer> & { name: string; phone: string }) => Customer;
  topUpCustomerDeposit: (customerId: string, amount: number) => void;
  updateCustomerMembership: (customerId: string, tier: Customer['membership']) => void;

  // POS Shift
  closeCurrentShift: (cashierName: string) => CashierShift;

  // Admin CRUD
  saveService: (service: Omit<Service, 'id'> & { id?: string }) => void;
  deleteService: (serviceId: string) => void;
  savePromo: (promo: Omit<Promo, 'id'> & { id?: string }) => void;
  deletePromo: (promoId: string) => void;
  saveEmployee: (employee: Omit<Employee, 'id'> & { id?: string }) => void;
  deleteEmployee: (employeeId: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (expenseId: string) => void;
  saveInventoryItem: (item: Omit<InventoryItem, 'id'> & { id?: string }) => void;
  restockInventoryItem: (itemId: string, addQty: number) => void;
  deleteInventoryItem: (itemId: string) => void;
  updateSettings: (updater: (prev: StoreSettings) => StoreSettings) => void;
  sendManualWhatsApp: (params: {
    phone: string;
    name: string;
    message: string;
    templateKey: 'order_received' | 'in_process' | 'ready_pickup' | 'payment_reminder' | 'promo_blast' | 'otp';
    orderNumber?: string;
  }) => void;
}

const LaundryContext = createContext<LaundryContextValue | null>(null);

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
  if (digits.startsWith('62')) return `+${digits}`;
  if (digits.startsWith('+62')) return digits;
  return digits ? `+62${digits}` : '+6281200000000';
}

export const LaundryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LaundryAppState>(() => {
    const saved = localDataRepository.loadState();
    return saved ?? createInitialSeedState();
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    localDataRepository.saveState(state);
  }, [state]);

  // Live 1-second tick for active self-service machine countdowns
  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((prev) => {
        const hasActiveMachine = prev.machines.some(
          (m) => m.status === 'Dipakai' && m.remainingSeconds > 0
        );
        if (!hasActiveMachine) return prev;

        let changed = false;
        const completedIds: string[] = [];

        const nextMachines = prev.machines.map((m) => {
          if (m.status !== 'Dipakai') return m;
          changed = true;
          if (m.remainingSeconds <= 1) {
            completedIds.push(m.id);
            return machineService.stopMachine(m);
          }
          return { ...m, remainingSeconds: m.remainingSeconds - 1 };
        });

        if (!changed) return prev;

        const nextSessions =
          completedIds.length > 0
            ? prev.machineSessions.map((s) =>
                s.status === 'Berjalan' && completedIds.includes(s.machineId)
                  ? { ...s, status: 'Selesai' as const, endedAt: new Date().toISOString() }
                  : s
              )
            : prev.machineSessions;

        return {
          ...prev,
          machines: nextMachines,
          machineSessions: nextSessions,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `tst-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const resetDemoData = useCallback(() => {
    localDataRepository.clearState();
    setState(createInitialSeedState());
    pushToast({
      title: 'Data demo direset',
      description: 'Seluruh order, mesin, dan laporan kembali ke kondisi awal.',
      tone: 'info',
    });
  }, [pushToast]);

  const sendManualWhatsApp = useCallback(
    (params: {
      phone: string;
      name: string;
      message: string;
      templateKey: 'order_received' | 'in_process' | 'ready_pickup' | 'payment_reminder' | 'promo_blast' | 'otp';
      orderNumber?: string;
    }) => {
      const log = notificationService.createWhatsAppLog({
        recipientPhone: normalizePhone(params.phone),
        recipientName: params.name,
        templateKey: params.templateKey,
        message: params.message,
        orderNumber: params.orderNumber,
      });
      setState((prev) => ({
        ...prev,
        notifications: [log, ...prev.notifications],
      }));
      pushToast({
        title: 'Notifikasi WhatsApp terkirim',
        description: `Ke ${params.name} (${log.recipientPhone})`,
        tone: 'success',
      });
    },
    [pushToast]
  );

  const createOrder = useCallback(
    async (payload: CreateOrderPayload): Promise<Order> => {
      const normalizedPhone = normalizePhone(payload.customerPhone);
      const now = new Date();
      const estHours =
        payload.model === 'self-service'
          ? 1
          : payload.speed === 'Premium'
          ? 6
          : payload.speed === 'Express'
          ? 24
          : 72;
      const estimatedFinishAt = new Date(now.getTime() + estHours * 3600 * 1000).toISOString();

      let createdOrder!: Order;

      // Payment record via mock PaymentService
      const paymentRecord = await paymentService.createPayment({
        amount: payload.paidAmount,
        method: payload.paymentMethod,
      });

      setState((prev) => {
        const orderNumber = generateOrderNumber(
          prev.orders.map((o) => o.orderNumber),
          now
        );

        let customer = prev.customers.find(
          (c) => c.id === payload.customerId || normalizePhone(c.phone) === normalizedPhone
        );
        let nextCustomers = prev.customers;

        if (!customer) {
          customer = {
            id: `cust-${Date.now()}`,
            name: payload.customerName,
            phone: normalizedPhone,
            membership: 'Reguler',
            points: Math.max(10, Math.floor(payload.total / 2000)),
            depositBalance: 0,
            totalOrders: 1,
            joinedAt: now.toISOString(),
            addresses: payload.addressText
              ? [
                  {
                    id: `addr-${Date.now()}`,
                    customerId: `cust-${Date.now()}`,
                    label: 'Alamat Utama',
                    street: payload.addressText,
                    district: 'Jakarta Selatan',
                    city: 'DKI Jakarta',
                    isDefault: true,
                  },
                ]
              : [],
          };
          nextCustomers = [customer, ...prev.customers];
        } else {
          const earnedPoints = Math.max(5, Math.floor(payload.total / 2000));
          nextCustomers = prev.customers.map((c) =>
            c.id === customer!.id
              ? {
                  ...c,
                  totalOrders: c.totalOrders + 1,
                  points: c.points + earnedPoints,
                }
              : c
          );
        }

        const initialQueueStatus: QueueStatus =
          payload.model === 'self-service' ? 'Selesai' : 'Diterima';

        createdOrder = {
          id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          orderNumber,
          customerId: customer.id,
          customerName: payload.customerName,
          customerPhone: normalizedPhone,
          branchId: payload.branchId ?? prev.branches[0]?.id ?? 'branch-kemang',
          model: payload.model,
          speed: payload.speed,
          items: payload.items,
          addons: payload.addons,
          subtotal: payload.subtotal,
          promoCode: payload.promoCode,
          discount: payload.discount,
          deliveryFee: payload.deliveryFee,
          total: payload.total,
          paidAmount: payload.paidAmount,
          paymentMethod: payload.paymentMethod,
          paymentStatus: payload.paymentStatus,
          queueStatus: initialQueueStatus,
          queueLogs: [
            {
              id: `ql-${Date.now()}`,
              status: initialQueueStatus,
              timestamp: now.toISOString(),
              actor: payload.actorName ?? 'Sistem Pemesanan Online',
              note: payload.model === 'self-service' ? 'Sesi self-service diaktifkan' : 'Order baru masuk',
            },
          ],
          pickupDelivery: payload.pickupDelivery,
          addressText: payload.addressText,
          pickupSchedule: payload.pickupSchedule,
          deliveryState: payload.pickupDelivery ? 'Menunggu Jemput' : undefined,
          notes: payload.notes,
          machineId: payload.machineId,
          createdAt: now.toISOString(),
          estimatedFinishAt,
        };

        const waMsg = notificationService.renderTemplate(prev.settings.templates.order_received, {
          nama: createdOrder.customerName,
          no_order: createdOrder.orderNumber,
          total: formatRupiah(createdOrder.total),
          estimasi: formatWIB(createdOrder.estimatedFinishAt),
        });

        const waLog = notificationService.createWhatsAppLog({
          recipientPhone: normalizedPhone,
          recipientName: createdOrder.customerName,
          templateKey: 'order_received',
          message: waMsg,
          orderNumber: createdOrder.orderNumber,
        });

        const nextPromos = payload.promoCode
          ? prev.promos.map((p) =>
              p.code.toUpperCase() === payload.promoCode!.toUpperCase()
                ? { ...p, usedCount: p.usedCount + 1 }
                : p
            )
          : prev.promos;

        // If self-service booking selected a machine, activate it immediately
        let nextMachines = prev.machines;
        let nextSessions = prev.machineSessions;
        if (payload.machineId) {
          const targetMachine = prev.machines.find((m) => m.id === payload.machineId);
          if (targetMachine && targetMachine.status === 'Tersedia') {
            nextMachines = prev.machines.map((m) =>
              m.id === targetMachine.id
                ? machineService.startMachine(m, m.durationMinutes, payload.customerName)
                : m
            );
            nextSessions = [
              {
                id: `ms-${Date.now()}`,
                machineId: targetMachine.id,
                machineName: targetMachine.name,
                customerName: payload.customerName,
                paymentSource: 'Booking Online',
                amount: targetMachine.pricePerCycle,
                durationMinutes: targetMachine.durationMinutes,
                startedAt: now.toISOString(),
                status: 'Berjalan',
              },
              ...prev.machineSessions,
            ];
          }
        }

        const linkedPayment = {
          ...paymentRecord,
          orderId: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
        };

        return {
          ...prev,
          customers: nextCustomers,
          orders: [createdOrder, ...prev.orders],
          payments: payload.paidAmount > 0 ? [linkedPayment, ...prev.payments] : prev.payments,
          promos: nextPromos,
          machines: nextMachines,
          machineSessions: nextSessions,
          notifications: [waLog, ...prev.notifications],
        };
      });

      pushToast({
        title: `Order ${createdOrder.orderNumber} berhasil dibuat`,
        description: `Notifikasi WhatsApp terkirim ke ${createdOrder.customerName}.`,
        tone: 'success',
      });

      return createdOrder;
    },
    [pushToast]
  );

  const updateOrderQueueStatus = useCallback(
    (orderId: string, newStatus: QueueStatus, actorName: string = 'Dewi Lestari (Kasir)') => {
      let targetOrder: Order | undefined;
      setState((prev) => {
        const existing = prev.orders.find((o) => o.id === orderId);
        if (!existing || existing.queueStatus === newStatus) return prev;
        targetOrder = existing;

        const templateKey =
          newStatus === 'Siap'
            ? 'ready_pickup'
            : newStatus === 'Diterima'
            ? 'order_received'
            : 'in_process';

        const waMessage = notificationService.renderTemplate(prev.settings.templates[templateKey], {
          nama: existing.customerName,
          no_order: existing.orderNumber,
          status: newStatus,
          total: formatRupiah(existing.total),
          estimasi: formatWIB(existing.estimatedFinishAt),
        });

        const waLog = notificationService.createWhatsAppLog({
          recipientPhone: existing.customerPhone,
          recipientName: existing.customerName,
          templateKey,
          message: waMessage,
          orderNumber: existing.orderNumber,
        });

        return {
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  queueStatus: newStatus,
                  queueLogs: [
                    ...o.queueLogs,
                    {
                      id: `ql-${Date.now()}`,
                      status: newStatus,
                      timestamp: new Date().toISOString(),
                      actor: actorName,
                    },
                  ],
                }
              : o
          ),
          notifications: [waLog, ...prev.notifications],
        };
      });

      if (targetOrder) {
        pushToast({
          title: `Status → ${newStatus} • Notifikasi WhatsApp terkirim`,
          description: `${targetOrder.orderNumber} (${targetOrder.customerName}) diperbarui.`,
          tone: 'success',
        });
      }
    },
    [pushToast]
  );

  const settleOrderPayment = useCallback(
    (orderId: string, method: PaymentMethod) => {
      setState((prev) => {
        const order = prev.orders.find((o) => o.id === orderId);
        if (!order) return prev;
        const remaining = Math.max(0, order.total - order.paidAmount);
        if (remaining <= 0) return prev;

        const newPayment = {
          id: `pay-${Date.now()}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          reference: `LNS-${Date.now().toString().slice(-6)}`,
          provider: method === 'Tunai' ? ('Kasir' as const) : ('Midtrans' as const),
          method,
          amount: remaining,
          status: 'Berhasil' as const,
          createdAt: new Date().toISOString(),
        };

        return {
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId
              ? { ...o, paidAmount: o.total, paymentStatus: 'Lunas', paymentMethod: method }
              : o
          ),
          payments: [newPayment, ...prev.payments],
        };
      });

      pushToast({
        title: 'Pelunasan berhasil dicatat',
        description: `Tagihan pesanan telah berstatus Lunas (${method}).`,
        tone: 'success',
      });
    },
    [pushToast]
  );

  const assignCourierToOrder = useCallback(
    (
      orderId: string,
      courierId: string,
      deliveryState: NonNullable<Order['deliveryState']>
    ) => {
      setState((prev) => {
        const courier = prev.employees.find((e) => e.id === courierId);
        return {
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  courierId,
                  courierName: courier?.name ?? o.courierName,
                  deliveryState,
                }
              : o
          ),
        };
      });
      pushToast({
        title: 'Penugasan kurir diperbarui',
        description: `Status pengantaran: ${deliveryState}.`,
        tone: 'info',
      });
    },
    [pushToast]
  );

  const sellTokenAndActivateMachine = useCallback(
    ({
      machineId,
      customerName,
      paymentSource,
    }: {
      machineId: string;
      customerName: string;
      paymentSource: 'Token' | 'QRIS' | 'Booking Online';
    }) => {
      let activatedName = '';
      setState((prev) => {
        const machine = prev.machines.find((m) => m.id === machineId);
        if (!machine || machine.status !== 'Tersedia') return prev;
        activatedName = machine.name;
        const now = new Date().toISOString();

        const updatedMachine = machineService.startMachine(
          machine,
          machine.durationMinutes,
          customerName
        );
        const tokenCode = `TKN-${Math.floor(1000 + Math.random() * 9000)}`;
        const method: PaymentMethod = paymentSource === 'QRIS' ? 'QRIS' : 'Tunai';

        return {
          ...prev,
          machines: prev.machines.map((m) => (m.id === machineId ? updatedMachine : m)),
          machineSessions: [
            {
              id: `ms-${Date.now()}`,
              machineId: machine.id,
              machineName: machine.name,
              customerName,
              paymentSource,
              amount: machine.pricePerCycle,
              durationMinutes: machine.durationMinutes,
              startedAt: now,
              status: 'Berjalan',
            },
            ...prev.machineSessions,
          ],
          tokens:
            paymentSource === 'Token'
              ? [
                  {
                    id: `tkn-${Date.now()}`,
                    code: tokenCode,
                    price: machine.pricePerCycle,
                    customerName,
                    soldAt: now,
                    usedOnMachineId: machine.id,
                    status: 'Terpakai',
                  },
                  ...prev.tokens,
                ]
              : prev.tokens,
          payments: [
            {
              id: `pay-${Date.now()}`,
              reference: paymentSource === 'Token' ? tokenCode : `QRIS-${Date.now().toString().slice(-5)}`,
              provider: paymentSource === 'QRIS' ? 'Midtrans' : 'Kasir',
              method,
              amount: machine.pricePerCycle,
              status: 'Berhasil',
              createdAt: now,
            },
            ...prev.payments,
          ],
        };
      });

      if (activatedName) {
        pushToast({
          title: `${activatedName} berhasil diaktifkan`,
          description: `Sesi ${paymentSource} a.n. ${customerName} sedang berjalan.`,
          tone: 'success',
        });
      }
    },
    [pushToast]
  );

  const stopMachineSession = useCallback(
    (machineId: string) => {
      setState((prev) => ({
        ...prev,
        machines: prev.machines.map((m) => (m.id === machineId ? machineService.stopMachine(m) : m)),
        machineSessions: prev.machineSessions.map((s) =>
          s.machineId === machineId && s.status === 'Berjalan'
            ? { ...s, status: 'Selesai', endedAt: new Date().toISOString() }
            : s
        ),
      }));
      pushToast({
        title: 'Mesin dihentikan & kembali Tersedia',
        tone: 'info',
      });
    },
    [pushToast]
  );

  const saveMachine = useCallback(
    (machine: Omit<Machine, 'id'> & { id?: string }) => {
      setState((prev) => {
        if (machine.id) {
          return {
            ...prev,
            machines: prev.machines.map((m) =>
              m.id === machine.id ? ({ ...m, ...machine } as Machine) : m
            ),
          };
        }
        const created: Machine = {
          ...machine,
          id: `mch-${Date.now()}`,
        };
        return { ...prev, machines: [...prev.machines, created] };
      });
      pushToast({ title: 'Data mesin disimpan', tone: 'success' });
    },
    [pushToast]
  );

  const deleteMachine = useCallback(
    (machineId: string) => {
      setState((prev) => ({
        ...prev,
        machines: prev.machines.filter((m) => m.id !== machineId),
      }));
      pushToast({ title: 'Mesin dihapus dari daftar', tone: 'info' });
    },
    [pushToast]
  );

  const loginCustomerByPhone = useCallback(
    (phone: string, nameIfNew?: string): Customer => {
      const normalized = normalizePhone(phone);
      let loggedIn!: Customer;
      setState((prev) => {
        const existing = prev.customers.find((c) => normalizePhone(c.phone) === normalized);
        if (existing) {
          loggedIn = existing;
          return { ...prev, activeCustomerId: existing.id };
        }
        loggedIn = {
          id: `cust-${Date.now()}`,
          name: nameIfNew?.trim() || 'Pelanggan Baru',
          phone: normalized,
          membership: 'Reguler',
          points: 25,
          depositBalance: 0,
          totalOrders: 0,
          joinedAt: new Date().toISOString(),
          addresses: [],
        };
        return {
          ...prev,
          customers: [loggedIn, ...prev.customers],
          activeCustomerId: loggedIn.id,
        };
      });
      return loggedIn;
    },
    []
  );

  const logoutCustomer = useCallback(() => {
    setState((prev) => ({ ...prev, activeCustomerId: null }));
    pushToast({ title: 'Berhasil keluar dari akun pelanggan', tone: 'info' });
  }, [pushToast]);

  const addCustomerAddress = useCallback(
    (customerId: string, address: Omit<Address, 'id' | 'customerId'>) => {
      setState((prev) => ({
        ...prev,
        customers: prev.customers.map((c) => {
          if (c.id !== customerId) return c;
          const nextAddresses = address.isDefault
            ? c.addresses.map((a) => ({ ...a, isDefault: false }))
            : c.addresses;
          return {
            ...c,
            addresses: [
              ...nextAddresses,
              { ...address, id: `addr-${Date.now()}`, customerId },
            ],
          };
        }),
      }));
      pushToast({ title: 'Alamat tersimpan ditambahkan', tone: 'success' });
    },
    [pushToast]
  );

  const deleteCustomerAddress = useCallback((customerId: string, addressId: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? { ...c, addresses: c.addresses.filter((a) => a.id !== addressId) }
          : c
      ),
    }));
  }, []);

  const upsertCustomer = useCallback(
    (payload: Partial<Customer> & { name: string; phone: string }): Customer => {
      const normalized = normalizePhone(payload.phone);
      let result!: Customer;
      setState((prev) => {
        const existing = prev.customers.find(
          (c) => (payload.id && c.id === payload.id) || normalizePhone(c.phone) === normalized
        );
        if (existing) {
          result = { ...existing, ...payload, phone: normalized };
          return {
            ...prev,
            customers: prev.customers.map((c) => (c.id === existing.id ? result : c)),
          };
        }
        result = {
          id: `cust-${Date.now()}`,
          name: payload.name,
          phone: normalized,
          email: payload.email,
          membership: payload.membership ?? 'Reguler',
          points: payload.points ?? 0,
          depositBalance: payload.depositBalance ?? 0,
          totalOrders: 0,
          joinedAt: new Date().toISOString(),
          addresses: [],
        };
        return { ...prev, customers: [result, ...prev.customers] };
      });
      pushToast({ title: `Pelanggan ${payload.name} tersimpan`, tone: 'success' });
      return result;
    },
    [pushToast]
  );

  const topUpCustomerDeposit = useCallback(
    (customerId: string, amount: number) => {
      setState((prev) => ({
        ...prev,
        customers: prev.customers.map((c) =>
          c.id === customerId ? { ...c, depositBalance: c.depositBalance + amount } : c
        ),
      }));
      pushToast({
        title: `Saldo deposit +${formatRupiah(amount)} berhasil ditambahkan`,
        tone: 'success',
      });
    },
    [pushToast]
  );

  const updateCustomerMembership = useCallback(
    (customerId: string, tier: Customer['membership']) => {
      setState((prev) => ({
        ...prev,
        customers: prev.customers.map((c) =>
          c.id === customerId ? { ...c, membership: tier } : c
        ),
      }));
      pushToast({ title: `Membership diperbarui ke ${tier}`, tone: 'success' });
    },
    [pushToast]
  );

  const closeCurrentShift = useCallback(
    (cashierName: string): CashierShift => {
      let closedShift!: CashierShift;
      setState((prev) => {
        const today = new Date().toISOString().slice(0, 10);
        const todayOrders = prev.orders.filter((o) => o.createdAt.slice(0, 10) === today);
        const todayTokens = prev.tokens.filter((t) => t.soldAt.slice(0, 10) === today);
        const cashTotal =
          todayOrders
            .filter((o) => o.paymentMethod === 'Tunai' || o.paymentMethod === 'COD')
            .reduce((s, o) => s + o.paidAmount, 0) +
          todayTokens.reduce((s, t) => s + t.price, 0);
        const nonCashTotal = todayOrders
          .filter((o) => o.paymentMethod !== 'Tunai' && o.paymentMethod !== 'COD')
          .reduce((s, o) => s + o.paidAmount, 0);

        closedShift = {
          id: `shf-${Date.now()}`,
          cashierName,
          openedAt: prev.shifts[0]?.openedAt ?? new Date().toISOString(),
          closedAt: new Date().toISOString(),
          openingCash: 300000,
          cashTotal,
          nonCashTotal,
          orderCount: todayOrders.length,
          tokenCount: todayTokens.length,
          status: 'Ditutup',
        };

        return {
          ...prev,
          shifts: [
            closedShift,
            ...prev.shifts.filter((s) => s.status !== 'Aktif'),
          ],
        };
      });
      pushToast({
        title: 'Shift kasir berhasil ditutup',
        description: `Ringkasan setoran a.n. ${cashierName} telah dicatat.`,
        tone: 'success',
      });
      return closedShift;
    },
    [pushToast]
  );

  const saveService = useCallback(
    (service: Omit<Service, 'id'> & { id?: string }) => {
      setState((prev) => {
        if (service.id) {
          return {
            ...prev,
            services: prev.services.map((s) =>
              s.id === service.id ? ({ ...s, ...service } as Service) : s
            ),
          };
        }
        const created: Service = { ...service, id: `srv-${Date.now()}` };
        return { ...prev, services: [...prev.services, created] };
      });
      pushToast({ title: 'Layanan & tarif berhasil disimpan', tone: 'success' });
    },
    [pushToast]
  );

  const deleteService = useCallback(
    (serviceId: string) => {
      setState((prev) => ({
        ...prev,
        services: prev.services.filter((s) => s.id !== serviceId),
      }));
      pushToast({ title: 'Layanan dihapus', tone: 'info' });
    },
    [pushToast]
  );

  const savePromo = useCallback(
    (promo: Omit<Promo, 'id'> & { id?: string }) => {
      setState((prev) => {
        const normalizedCode = promo.code.trim().toUpperCase();
        if (promo.id) {
          return {
            ...prev,
            promos: prev.promos.map((p) =>
              p.id === promo.id ? ({ ...p, ...promo, code: normalizedCode } as Promo) : p
            ),
          };
        }
        return {
          ...prev,
          promos: [...prev.promos, { ...promo, code: normalizedCode, id: `prm-${Date.now()}` }],
        };
      });
      pushToast({ title: 'Promo berhasil disimpan', tone: 'success' });
    },
    [pushToast]
  );

  const deletePromo = useCallback(
    (promoId: string) => {
      setState((prev) => ({
        ...prev,
        promos: prev.promos.filter((p) => p.id !== promoId),
      }));
      pushToast({ title: 'Promo dihapus', tone: 'info' });
    },
    [pushToast]
  );

  const saveEmployee = useCallback(
    (employee: Omit<Employee, 'id'> & { id?: string }) => {
      setState((prev) => {
        if (employee.id) {
          return {
            ...prev,
            employees: prev.employees.map((e) =>
              e.id === employee.id ? ({ ...e, ...employee } as Employee) : e
            ),
          };
        }
        return {
          ...prev,
          employees: [...prev.employees, { ...employee, id: `emp-${Date.now()}` }],
        };
      });
      pushToast({ title: 'Data karyawan & peran tersimpan', tone: 'success' });
    },
    [pushToast]
  );

  const deleteEmployee = useCallback(
    (employeeId: string) => {
      setState((prev) => ({
        ...prev,
        employees: prev.employees.filter((e) => e.id !== employeeId),
      }));
      pushToast({ title: 'Karyawan dihapus', tone: 'info' });
    },
    [pushToast]
  );

  const addExpense = useCallback(
    (expense: Omit<Expense, 'id'>) => {
      setState((prev) => ({
        ...prev,
        expenses: [{ ...expense, id: `exp-${Date.now()}` }, ...prev.expenses],
      }));
      pushToast({ title: 'Pengeluaran berhasil dicatat', tone: 'success' });
    },
    [pushToast]
  );

  const deleteExpense = useCallback(
    (expenseId: string) => {
      setState((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== expenseId),
      }));
    },
    []
  );

  const saveInventoryItem = useCallback(
    (item: Omit<InventoryItem, 'id'> & { id?: string }) => {
      setState((prev) => {
        if (item.id) {
          return {
            ...prev,
            inventory: prev.inventory.map((i) =>
              i.id === item.id ? ({ ...i, ...item } as InventoryItem) : i
            ),
          };
        }
        return {
          ...prev,
          inventory: [...prev.inventory, { ...item, id: `inv-${Date.now()}` }],
        };
      });
      pushToast({ title: 'Item inventaris disimpan', tone: 'success' });
    },
    [pushToast]
  );

  const restockInventoryItem = useCallback(
    (itemId: string, addQty: number) => {
      setState((prev) => ({
        ...prev,
        inventory: prev.inventory.map((i) =>
          i.id === itemId
            ? {
                ...i,
                stock: i.stock + addQty,
                lastRestockedAt: new Date().toISOString().slice(0, 10),
              }
            : i
        ),
      }));
      pushToast({ title: `Stok berhasil ditambah (+${addQty})`, tone: 'success' });
    },
    [pushToast]
  );

  const deleteInventoryItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((i) => i.id !== itemId),
    }));
  }, []);

  const updateSettings = useCallback(
    (updater: (prev: StoreSettings) => StoreSettings) => {
      setState((prev) => ({
        ...prev,
        settings: updater(prev.settings),
      }));
      pushToast({ title: 'Pengaturan usaha disimpan', tone: 'success' });
    },
    [pushToast]
  );

  return (
    <LaundryContext.Provider
      value={{
        state,
        toasts,
        pushToast,
        dismissToast,
        resetDemoData,
        createOrder,
        updateOrderQueueStatus,
        settleOrderPayment,
        assignCourierToOrder,
        sellTokenAndActivateMachine,
        stopMachineSession,
        saveMachine,
        deleteMachine,
        loginCustomerByPhone,
        logoutCustomer,
        addCustomerAddress,
        deleteCustomerAddress,
        upsertCustomer,
        topUpCustomerDeposit,
        updateCustomerMembership,
        closeCurrentShift,
        saveService,
        deleteService,
        savePromo,
        deletePromo,
        saveEmployee,
        deleteEmployee,
        addExpense,
        deleteExpense,
        saveInventoryItem,
        restockInventoryItem,
        deleteInventoryItem,
        updateSettings,
        sendManualWhatsApp,
      }}
    >
      {children}
    </LaundryContext.Provider>
  );
};

export function useLaundry(): LaundryContextValue {
  const ctx = useContext(LaundryContext);
  if (!ctx) throw new Error('useLaundry harus digunakan di dalam LaundryProvider');
  return ctx;
}
