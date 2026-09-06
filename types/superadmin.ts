export interface PlatformStats {
  total_tenants: number
  active_tenants: number
  trial_tenants: number
  total_mrr: number
  new_tenants_this_month: number
}

export interface TenantListItem {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  subscription_status: string
  trial_ends_at?: string
  status: string
  active_plan?: string
  plan_ends_at?: string
  total_users: number
  total_assets: number
  total_bookings: number
  created_at: string
}

export interface TenantDetail extends TenantListItem {
  timezone: string
  locale: string
  currency: string
  subscription?: SubscriptionInfo
}

export interface SubscriptionInfo {
  id: string
  plan_name: string
  plan_slug: string
  billing_cycle: string
  price_paid: number
  starts_at: string
  ends_at: string
  auto_renew: boolean
  status: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description?: string
  price_monthly: number
  price_yearly: number
  max_assets?: number
  max_users?: number
  features: string[]
}
