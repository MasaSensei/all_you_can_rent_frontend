import { get, post, put, del } from '@/lib/api/client'
import type {
  Category, PricingRule, Coupon, ListParams,
} from '@/types/api'

// ---- Categories ----
export const categoryApi = {
  list:   (params?: ListParams) => get<Category[]>('/categories', params as Record<string, unknown>),
  get:    (id: string)          => get<Category>(`/categories/${id}`),
  create: (data: Partial<Category>) => post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) => put<Category>(`/categories/${id}`, data),
  delete: (id: string)          => del(`/categories/${id}`),
}

// ---- Pricing Rules ----
export const pricingRuleApi = {
  list:   (params?: ListParams)         => get<PricingRule[]>('/pricing-rules', params as Record<string, unknown>),
  get:    (id: string)                  => get<PricingRule>(`/pricing-rules/${id}`),
  create: (data: Partial<PricingRule>)  => post<PricingRule>('/pricing-rules', data),
  update: (id: string, d: Partial<PricingRule>) => put<PricingRule>(`/pricing-rules/${id}`, d),
  delete: (id: string)                  => del(`/pricing-rules/${id}`),
}

// ---- Coupons ----
export const couponApi = {
  list:   (params?: ListParams)      => get<Coupon[]>('/coupons', params as Record<string, unknown>),
  get:    (id: string)               => get<Coupon>(`/coupons/${id}`),
  create: (data: Partial<Coupon>)    => post<Coupon>('/coupons', data),
  update: (id: string, d: Partial<Coupon>) => put<Coupon>(`/coupons/${id}`, d),
  delete: (id: string)               => del(`/coupons/${id}`),
}

// ---- Taxes ----
export interface TaxCreateRequest {
  name: string; rate: number; tax_type: 'percentage' | 'fixed'; is_default: boolean
}
export interface TaxResponse {
  id: string; name: string; rate: number; tax_type: string; is_default: boolean; status: string; created_at: string
}
export const taxApi = {
  list:   ()                           => get<TaxResponse[]>('/taxes'),
  create: (data: TaxCreateRequest)     => post<TaxResponse>('/taxes', data),
  update: (id: string, d: Partial<TaxCreateRequest>) => put<TaxResponse>(`/taxes/${id}`, d),
  delete: (id: string)                 => del(`/taxes/${id}`),
}

// ---- Notification Templates ----
export interface NotifTemplate {
  id: string; name: string; channel: string; subject?: string; body: string
  event_trigger: string; status: string; created_at: string
}
export interface NotifTemplateCreate {
  name: string; channel: string; subject?: string; body: string; event_trigger: string
}
export const notifTemplateApi = {
  list:   ()                              => get<NotifTemplate[]>('/notification-templates'),
  get:    (id: string)                    => get<NotifTemplate>(`/notification-templates/${id}`),
  create: (data: NotifTemplateCreate)     => post<NotifTemplate>('/notification-templates', data),
  update: (id: string, d: Partial<NotifTemplateCreate>) => put<NotifTemplate>(`/notification-templates/${id}`, d),
  delete: (id: string)                    => del(`/notification-templates/${id}`),
}

// ---- Loyalty Programs ----
export interface LoyaltyProgram {
  id: string; name: string; description?: string; points_per_currency: number
  redemption_rate: number; status: string; created_at: string
}
export const loyaltyApi = {
  list:   ()                               => get<LoyaltyProgram[]>('/loyalty-programs'),
  create: (data: Partial<LoyaltyProgram>)  => post<LoyaltyProgram>('/loyalty-programs', data),
  update: (id: string, d: Partial<LoyaltyProgram>) => put<LoyaltyProgram>(`/loyalty-programs/${id}`, d),
  delete: (id: string)                     => del(`/loyalty-programs/${id}`),
}

// ---- Users (tenant users) ----
export interface TenantUser {
  id: string; username: string; email: string; first_name?: string; last_name?: string
  is_active: boolean; status: string; created_at: string; roles?: string[]
}
export interface InviteUser {
  email: string; first_name: string; last_name: string; role_id: string; password: string
}
export const tenantUserApi = {
  list:   (params?: ListParams)    => get<TenantUser[]>('/users', params as Record<string, unknown>),
  invite: (data: InviteUser)       => post<TenantUser>('/users', data),
  update: (id: string, d: Partial<TenantUser>) => put<TenantUser>(`/users/${id}`, d),
  deactivate: (id: string)         => del(`/users/${id}`),
}

// ---- Roles ----
export interface Role {
  id: string; name: string; description?: string; is_system: boolean; status: string; created_at: string
}
export interface Permission { id: string; name: string; module: string; description?: string }
export const roleApi = {
  list:        ()                         => get<Role[]>('/roles'),
  create:      (data: Partial<Role>)      => post<Role>('/roles', data),
  update:      (id: string, d: Partial<Role>) => put<Role>(`/roles/${id}`, d),
  delete:      (id: string)              => del(`/roles/${id}`),
  listPermissions: ()                    => get<Permission[]>('/permissions'),
  assignPermissions: (roleId: string, permIds: string[]) =>
    post(`/roles/${roleId}/permissions`, { permission_ids: permIds }),
}
