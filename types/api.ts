// ============================================================
// RentOS Frontend — API Types
// Mirror of Go backend response structs.
// Updated in sync with BE response DTOs.
// ============================================================

// ---- Shared envelope ----

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: unknown;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total?: number;
}

// ---- Auth ----

export interface User {
  id: string;
  tenant_id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

// ---- Inventory ----

export interface Category {
  id: string;
  tenant_id: string;
  parent_id?: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
}

export type AssetCondition = "new" | "good" | "fair" | "poor";

export interface Asset {
  id: string;
  tenant_id: string;
  category_id?: string;
  name: string;
  description?: string;
  serial_number?: string;
  condition: AssetCondition;
  purchase_price?: number;
  current_value?: number;
  location?: string;
  is_available: boolean;
  status: string;
  images?: AssetImage[];
  created_at: string;
  updated_at: string;
}

export interface AssetImage {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

// ---- Booking ----

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface BookingItem {
  id: string;
  asset_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  start_date: string;
  end_date: string;
  status: string;
}

export interface Booking {
  id: string;
  tenant_id: string;
  customer_id: string;
  coupon_id?: string;
  booking_number: string;
  start_date: string;
  end_date: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total_amount: number;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  notes?: string;
  items?: BookingItem[];
  created_at: string;
  updated_at: string;
}

// ---- Pricing ----

export type RuleType = "flat" | "per_day" | "per_hour" | "per_week";

export interface PricingRule {
  id: string;
  tenant_id: string;
  category_id?: string;
  asset_id?: string;
  name: string;
  rule_type: RuleType;
  value: number;
  duration_unit: string;
  valid_from?: string;
  valid_to?: string;
  status: string;
}

export interface Coupon {
  id: string;
  tenant_id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number;
  usage_limit?: number;
  used_count: number;
  valid_from?: string;
  valid_to?: string;
  status: string;
}

// ---- Finance ----

export type InvoiceStatus = "unpaid" | "partial" | "paid" | "voided";

export interface Invoice {
  id: string;
  tenant_id: string;
  customer_id: string;
  booking_id?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  invoice_status: InvoiceStatus;
  items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  booking_item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  line_total: number;
}

export interface Payment {
  id: string;
  tenant_id: string;
  invoice_id: string;
  customer_id: string;
  payment_method: string;
  transaction_reference?: string;
  amount: number;
  currency: string;
  paid_at?: string;
  payment_status: string;
  created_at: string;
}

// ---- CRM ----

export type CustomerType = "individual" | "corporate";

export interface Customer {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  customer_type: CustomerType;
  status: string;
  addresses?: CustomerAddress[];
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  address_type: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
}

export interface LoyaltyBalance {
  customer_id: string;
  balance: number;
}

// ---- Maintenance ----

export type MaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface MaintenanceRecord {
  id: string;
  tenant_id: string;
  asset_id: string;
  maintenance_type: string;
  description?: string;
  cost: number;
  scheduled_date?: string;
  completed_date?: string;
  performed_by?: string;
  maintenance_status: MaintenanceStatus;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DamageReport {
  id: string;
  tenant_id: string;
  asset_id: string;
  booking_id?: string;
  description: string;
  severity: "minor" | "moderate" | "severe" | "total_loss";
  repair_cost: number;
  charged_amount: number;
  report_status: string;
  created_at: string;
}

// ---- Reports ----

export type ReportStatus = "queued" | "processing" | "completed" | "failed";

export interface Report {
  id: string;
  tenant_id: string;
  name: string;
  report_type: string;
  generated_format: string;
  file_url?: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  total_revenue: number;
  total_bookings: number;
  active_customers: number;
  revenue: RevenueDataPoint[];
  top_assets: AssetUtilizationItem[];
}

export interface RevenueDataPoint {
  period: string;
  revenue: number;
  count: number;
}

export interface AssetUtilizationItem {
  asset_id: string;
  asset_name: string;
  booked_days: number;
  total_days: number;
  utilization_pct: number;
}

// ---- Integration ----

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at?: string;
  expires_at?: string;
  status: string;
  created_at: string;
}

export interface ApiKeyCreated extends ApiKey {
  key: string; // raw key — shown only once
}

export interface Webhook {
  id: string;
  tenant_id: string;
  url: string;
  events: string[];
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

// ---- Utility types ----

export type SortDirection = "asc" | "desc";

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}
