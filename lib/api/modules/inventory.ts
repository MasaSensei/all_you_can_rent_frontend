import { get, post, put, del } from "@/lib/api/client";
import type { Asset, Category, ListParams } from "@/types/api";

export const inventoryApi = {
  // Categories
  listCategories: () => get<Category[]>("/categories"),
  createCategory: (data: Partial<Category>) =>
    post<Category>("/categories", data),
  deleteCategory: (id: string) => del(`/categories/${id}`),

  // Assets
  listAssets: (params?: ListParams) => get<Asset[]>("/assets", params),
  getAsset: (id: string) => get<Asset>(`/assets/${id}`),
  createAsset: (data: Partial<Asset>) => post<Asset>("/assets", data),
  updateAsset: (id: string, data: Partial<Asset>) =>
    put<Asset>(`/assets/${id}`, data),
  deleteAsset: (id: string) => del(`/assets/${id}`),

  checkAvailability: (assetId: string, startDate: string, endDate: string) =>
    get<{ available: boolean }>(`/assets/${assetId}/availability`, {
      start_date: startDate,
      end_date: endDate,
    }),
};
