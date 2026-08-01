import { get, post, put, patch, del } from "@/lib/api/client";
import type {
  Booking,
  Customer,
  Dashboard,
  Invoice,
  ListParams,
  MaintenanceRecord,
  Payment,
  Report,
} from "@/types/api";

// ---- Bookings ----

export const bookingApi = {
  list: (params?: ListParams) => get<Booking[]>("/bookings", params),
  get: (id: string) => get<Booking>(`/bookings/${id}`),
  create: (data: {
    customer_id: string;
    items: {
      asset_id: string;
      quantity: number;
      start_date: string;
      end_date: string;
    }[];
    coupon_code?: string;
    notes?: string;
  }) => post<Booking>("/bookings", data),
  confirm: (id: string) => post<Booking>(`/bookings/${id}/confirm`),
  cancel: (id: string, reason?: string) =>
    post<Booking>(`/bookings/${id}/cancel`, { reason }),
  extend: (itemId: string, data: { new_end_date: string; reason?: string }) =>
    post(`/booking-items/${itemId}/extend`, data),
  return: (
    itemId: string,
    data: {
      condition: string;
      late_fee?: number;
      damage_fee?: number;
      notes?: string;
    },
  ) => post(`/booking-items/${itemId}/return`, data),
};

// ---- Finance ----

export const financeApi = {
  listInvoices: (params?: ListParams) => get<Invoice[]>("/invoices", params),
  getInvoice: (id: string) => get<Invoice>(`/invoices/${id}`),
  createInvoiceFromBooking: (data: {
    booking_id: string;
    customer_id: string;
    due_date: string;
  }) => post<Invoice>("/invoices", data),

  recordPayment: (data: {
    invoice_id: string;
    customer_id: string;
    payment_method: string;
    amount: number;
    currency: string;
    transaction_reference?: string;
  }) => post<Payment>("/payments", data),
  listPaymentsByInvoice: (invoiceId: string) =>
    get<Payment[]>(`/invoices/${invoiceId}/payments`),

  createRefund: (data: {
    payment_id: string;
    amount: number;
    reason?: string;
  }) => post("/refunds", data),
};

// ---- Customers ----

export const customerApi = {
  list: (params?: ListParams) => get<Customer[]>("/customers", params),
  get: (id: string) => get<Customer>(`/customers/${id}`),
  create: (data: Partial<Customer>) => post<Customer>("/customers", data),
  update: (id: string, data: Partial<Customer>) =>
    put<Customer>(`/customers/${id}`, data),
  delete: (id: string) => del(`/customers/${id}`),
  addAddress: (
    customerId: string,
    data: {
      address_type: string;
      line1: string;
      city: string;
      country: string;
      is_default?: boolean;
    },
  ) => post(`/customers/${customerId}/addresses`, data),
  getLoyaltyBalance: (customerId: string, programId: string) =>
    get<{ customer_id: string; balance: number }>(
      `/customers/${customerId}/loyalty/balance/${programId}`,
    ),
};

// ---- Maintenance ----

export const maintenanceApi = {
  list: (params?: ListParams) =>
    get<MaintenanceRecord[]>("/maintenance-records", params),
  get: (id: string) => get<MaintenanceRecord>(`/maintenance-records/${id}`),
  schedule: (data: {
    asset_id: string;
    maintenance_type: string;
    description?: string;
    cost?: number;
    scheduled_date?: string;
  }) => post<MaintenanceRecord>("/maintenance-records", data),
  updateStatus: (
    id: string,
    data: {
      maintenance_status: string;
      completed_date?: string;
      cost?: number;
    },
  ) => patch<MaintenanceRecord>(`/maintenance-records/${id}/status`, data),
  delete: (id: string) => del(`/maintenance-records/${id}`),
};

// ---- Reports + Dashboard ----

export const reportsApi = {
  dashboard: (data: { from: string; to: string; group_by: string }) =>
    post<Dashboard>("/analytics/dashboard", data),
  list: (params?: ListParams) => get<Report[]>("/reports", params),
  generate: (data: {
    name: string;
    report_type: string;
    generated_format: string;
    parameters?: Record<string, string>;
  }) => post<Report>("/reports", data),
  trackEvent: (data: {
    event_name: string;
    event_category?: string;
    event_data?: Record<string, string>;
    source?: string;
  }) => post("/analytics/events", data),
};
