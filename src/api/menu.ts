/**
 * 菜单相关 API
 * 这里集中所有「菜单分类」和「菜品」的请求，和后端的 /central/v1/menu/*、/menus 对应。
 * 用 axios 的 api 实例（已在 client.ts 里挂好 baseURL 和 token），所以这里只写路径和参数。
 */
import { api } from './client'
import type { Menu, MenuCategory, MenuSpec, StoredObject } from './types'

function parseSortField(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number.parseInt(value, 10)
    return Number.isNaN(n) ? undefined : n
  }
  return undefined
}

/** 统一 sort 字段：兼容后端 sort、sort_order、Sort 等；缺省按 0 处理，避免列表排序误走名称 */
export function normalizeMenuCategory(raw: unknown): MenuCategory {
  const o = raw as Record<string, unknown>
  const sortVal = parseSortField(o.sort ?? o.sort_order ?? o.Sort)
  return {
    id: String(o.id ?? ''),
    name: String(o.name ?? ''),
    description: o.description != null ? String(o.description) : undefined,
    sort: sortVal ?? 0,
    created_at: o.created_at != null ? String(o.created_at) : undefined,
    updated_at: o.updated_at != null ? String(o.updated_at) : undefined,
  }
}

/** 与后端 UpdateMenuCategoryReq 一致：全量提交 name、description、sort（description 可空串表示清空备注） */
export interface UpdateMenuCategoryBody {
  name: string
  description: string
  sort: number
}

// ============ 菜单分类 ============

export interface ListCategoriesParams {
  current?: number
  pageSize?: number
  name?: string
}

export interface ListCategoriesRes {
  categories: MenuCategory[]
  total: number
}

/** 拉取分类列表（GET，参数走 query） */
export async function listMenuCategories(params?: ListCategoriesParams): Promise<ListCategoriesRes> {
  const { data } = await api.get<ListCategoriesRes>('/central/v1/menu/categories', { params })
  const categories = Array.isArray(data?.categories) ? data.categories.map((c) => normalizeMenuCategory(c)) : []
  return { ...data, categories, total: Number(data?.total) || 0 }
}

/** 创建分类：name 必填，description / sort 可选 */
export async function createMenuCategory(body: { name: string; description?: string; sort?: number }): Promise<void> {
  await api.post('/central/v1/menu/category', body)
}

/** 获取单个分类 */
export async function getMenuCategory(id: string): Promise<{ category: MenuCategory }> {
  const { data } = await api.get<{ category: unknown }>(`/central/v1/menu/category/${id}`)
  return { category: normalizeMenuCategory(data?.category) }
}

/** 更新分类（全量）：必须带齐 name、description、sort，避免仅改排序时遗漏 description 被后端当成清空 */
export async function updateMenuCategory(id: string, body: UpdateMenuCategoryBody): Promise<void> {
  const sort = Math.round(Number(body.sort ?? 0))
  await api.put(`/central/v1/menu/category/${id}`, {
    name: body.name,
    description: body.description ?? '',
    sort,
  })
}

/** 删除分类 */
export async function deleteMenuCategory(id: string): Promise<void> {
  await api.delete(`/central/v1/menu/category/${id}`)
}

// ============ 菜品 ============

export interface ListMenusParams {
  current?: number
  pageSize?: number
  name?: string
  category?: string
}

export interface ListMenusRes {
  menus: Menu[]
  total: number
}

export interface ObjectURLRes {
  url: string
  expired_at: string
}

/** 拉取菜品列表 */
export async function listMenus(params?: ListMenusParams): Promise<ListMenusRes> {
  const { data } = await api.get<ListMenusRes>('/central/v1/menus', { params })
  return data
}

export interface CreateMenuBody {
  name: string
  price: number
  category_id: string
  description?: string
  /** 对象存储封面 ID（推荐优先传；私有桶场景由后端根据 object_id 回填 image） */
  object_id?: string
  image?: string
  specs?: MenuSpec[]
}

export type UpdateMenuBody = CreateMenuBody

/** 创建菜品 */
export async function createMenu(body: CreateMenuBody): Promise<void> {
  await api.post('/central/v1/menus', body)
}

/** 获取单个菜品 */
export async function getMenu(id: string): Promise<{ menu: Menu }> {
  const { data } = await api.get<{ menu: Menu }>(`/central/v1/menu/${id}`)
  return data
}

/** 更新菜品：后端要求平铺字段，不要包一层 menu 对象 */
export async function updateMenu(id: string, menu: UpdateMenuBody): Promise<void> {
  await api.put(`/central/v1/menu/${id}`, menu)
}

/** 删除菜品 */
export async function deleteMenu(id: string): Promise<void> {
  await api.delete(`/central/v1/menu/${id}`)
}

/** 上传文件到对象存储（multipart，字段名 file），返回对象元数据与可访问 URL */
export async function uploadObject(file: File): Promise<{ object: StoredObject }> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<{ object: StoredObject }>('/central/v1/objects/upload', formData, {
    transformRequest: [
      (body, headers) => {
        if (body instanceof FormData) {
          delete headers['Content-Type']
        }
        return body
      },
    ],
  })
  return data
}

/** 获取私有桶对象的临时签名 URL */
export async function getObjectUrl(id: string): Promise<ObjectURLRes> {
  const { data } = await api.get<ObjectURLRes>(`/central/v1/object/${id}/url`)
  return data
}
