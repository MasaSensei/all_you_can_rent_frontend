import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bookingApi,
  customerApi,
  financeApi,
  maintenanceApi,
  reportsApi,
} from "@/lib/api/modules/index";
import { inventoryApi } from "@/lib/api/modules/inventory";
import type {
  Asset,
  Booking,
  Customer,
  Dashboard,
  Invoice,
  ListParams,
  MaintenanceRecord,
} from "@/types/api";

// ---- Query keys ----
// Centralised here so invalidations are consistent across the app.

export const QK = {
  assets: (params?: ListParams) => ["assets", params] as const,
  asset: (id: string) => ["asset", id] as const,
  categories: () => ["categories"] as const,
  bookings: (params?: ListParams) => ["bookings", params] as const,
  booking: (id: string) => ["booking", id] as const,
  customers: (params?: ListParams) => ["customers", params] as const,
  customer: (id: string) => ["customer", id] as const,
  invoices: (params?: ListParams) => ["invoices", params] as const,
  invoice: (id: string) => ["invoice", id] as const,
  maintenance: (params?: ListParams) => ["maintenance", params] as const,
  dashboard: (from: string, to: string, groupBy: string) =>
    ["dashboard", from, to, groupBy] as const,
};

// ---- Inventory ----

export function useAssets(params?: ListParams) {
  return useQuery({
    queryKey: QK.assets(params),
    queryFn: () => inventoryApi.listAssets(params),
  });
}

export function useAsset(id: string, options?: UseQueryOptions<Asset>) {
  return useQuery({
    queryKey: QK.asset(id),
    queryFn: () => inventoryApi.getAsset(id),
    enabled: !!id,
    ...options,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: QK.categories(),
    queryFn: inventoryApi.listCategories,
    staleTime: 5 * 60 * 1000, // categories rarely change
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.createAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateAsset(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Asset>) => inventoryApi.updateAsset(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: QK.asset(id) });
      toast.success("Asset berhasil diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.deleteAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ---- Bookings ----

export function useBookings(params?: ListParams) {
  return useQuery({
    queryKey: QK.bookings(params),
    queryFn: () => bookingApi.list(params),
  });
}

export function useBooking(id: string, options?: UseQueryOptions<Booking>) {
  return useQuery({
    queryKey: QK.booking(id),
    queryFn: () => bookingApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingApi.create,
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(`Booking ${booking.booking_number} berhasil dibuat`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useConfirmBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingApi.confirm,
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: QK.booking(booking.id) });
      toast.success("Booking dikonfirmasi");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingApi.cancel(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking dibatalkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ---- Customers ----

export function useCustomers(params?: ListParams) {
  return useQuery({
    queryKey: QK.customers(params),
    queryFn: () => customerApi.list(params),
  });
}

export function useCustomer(id: string, options?: UseQueryOptions<Customer>) {
  return useQuery({
    queryKey: QK.customer(id),
    queryFn: () => customerApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customerApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ---- Finance ----

export function useInvoices(params?: ListParams) {
  return useQuery({
    queryKey: QK.invoices(params),
    queryFn: () => financeApi.listInvoices(params),
  });
}

export function useInvoice(id: string, options?: UseQueryOptions<Invoice>) {
  return useQuery({
    queryKey: QK.invoice(id),
    queryFn: () => financeApi.getInvoice(id),
    enabled: !!id,
    ...options,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financeApi.recordPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Pembayaran berhasil dicatat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ---- Maintenance ----

export function useMaintenance(params?: ListParams) {
  return useQuery({
    queryKey: QK.maintenance(params),
    queryFn: () => maintenanceApi.list(params),
  });
}

export function useScheduleMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: maintenanceApi.schedule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("Maintenance dijadwalkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ---- Dashboard ----

export function useDashboard(
  from: string,
  to: string,
  groupBy: "day" | "week" | "month",
  options?: UseQueryOptions<Dashboard>,
) {
  return useQuery({
    queryKey: QK.dashboard(from, to, groupBy),
    queryFn: () => reportsApi.dashboard({ from, to, group_by: groupBy }),
    ...options,
  });
}
