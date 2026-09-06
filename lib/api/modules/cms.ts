import { get, post, put, del } from '@/lib/api/client'

// ---- Types ----

export interface Website {
  id: string
  tenant_id: string
  domain: string
  title: string
  theme?: string
  status: string
  created_at: string
  updated_at: string
}

export interface Page {
  id: string
  tenant_id: string
  website_id: string
  title: string
  slug: string
  content?: string
  template?: string
  status: string
  created_at: string
  updated_at: string
}

export interface Menu {
  id: string
  tenant_id: string
  website_id: string
  name: string
  location?: string
  status: string
  items?: MenuItem[]
  created_at: string
}

export interface MenuItem {
  id: string
  menu_id: string
  parent_id?: string
  label: string
  url?: string
  sort_order: number
  status: string
  children?: MenuItem[]
}

export interface BlogCategory {
  id: string
  tenant_id: string
  name: string
  slug: string
  status: string
  created_at: string
}

export interface Blog {
  id: string
  tenant_id: string
  website_id: string
  author_id?: string
  blog_category_id?: string
  title: string
  slug: string
  content?: string
  featured_image?: string
  published_at?: string
  status: string
  created_at: string
  updated_at: string
}

export interface SeoMeta {
  id: string
  entity_type: string
  entity_id: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  og_image?: string
  canonical_url?: string
}

// ---- API ----

export const websiteApi = {
  list:   ()                           => get<Website[]>('/websites'),
  get:    (id: string)                 => get<Website>(`/websites/${id}`),
  create: (data: Partial<Website>)     => post<Website>('/websites', data),
  update: (id: string, d: Partial<Website>) => put<Website>(`/websites/${id}`, d),
  delete: (id: string)                 => del(`/websites/${id}`),
}

export const pageApi = {
  list:   (websiteId: string)          => get<Page[]>(`/websites/${websiteId}/pages`),
  get:    (id: string)                 => get<Page>(`/pages/${id}`),
  create: (data: Partial<Page>)        => post<Page>('/pages', data),
  update: (id: string, d: Partial<Page>) => put<Page>(`/pages/${id}`, d),
  delete: (id: string)                 => del(`/pages/${id}`),
}

export const menuApi = {
  list:        (websiteId: string)      => get<Menu[]>(`/websites/${websiteId}/menus`),
  get:         (id: string)             => get<Menu>(`/menus/${id}`),
  create:      (data: Partial<Menu>)    => post<Menu>('/menus', data),
  addItem:     (menuId: string, data: Partial<MenuItem>) => post<MenuItem>(`/menus/${menuId}/items`, data),
  deleteItem:  (itemId: string)         => del(`/menu-items/${itemId}`),
}

export const blogApi = {
  listCategories: ()                        => get<BlogCategory[]>('/blog-categories'),
  createCategory: (data: Partial<BlogCategory>) => post<BlogCategory>('/blog-categories', data),
  list:   (params?: Record<string, unknown>) => get<Blog[]>('/blogs', params),
  get:    (id: string)                       => get<Blog>(`/blogs/${id}`),
  create: (data: Partial<Blog>)              => post<Blog>('/blogs', data),
  update: (id: string, d: Partial<Blog>)     => put<Blog>(`/blogs/${id}`, d),
  delete: (id: string)                       => del(`/blogs/${id}`),
  publish:(id: string)                       => post<Blog>(`/blogs/${id}/publish`),
}

export const seoApi = {
  get:    (entityType: string, entityId: string) =>
    get<SeoMeta>(`/seo-meta/${entityType}/${entityId}`),
  upsert: (data: Partial<SeoMeta>) =>
    post<SeoMeta>('/seo-meta', data),
}
