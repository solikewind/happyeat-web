import { api } from './client'
import type { Table, TableCategory } from './types'

function parseSortField(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number.parseInt(value, 10)
    return Number.isNaN(n) ? undefined : n
  }
  return undefined
}

export function normalizeTableCategory(raw: unknown): TableCategory {
  const o = raw as Record<string, unknown>
  return {
    id: String(o.id ?? ''),
    name: String(o.name ?? ''),
    description: o.description != null ? String(o.description) : undefined,
    sort: parseSortField(o.sort ?? o.sort_order ?? o.Sort) ?? 0,
  }
}

export function normalizeTable(raw: unknown): Table {
  const o = raw as Record<string, unknown>
  return {
    id: String(o.id ?? ''),
    code: String(o.code ?? ''),
    status: String(o.status ?? 'idle'),
    capacity: Number(o.capacity) || 0,
    category_id: String(o.category_id ?? ''),
    sort: parseSortField(o.sort ?? o.sort_order ?? o.Sort) ?? 0,
    qr_code: o.qr_code != null ? String(o.qr_code) : undefined,
    create_at: Number(o.created_at ?? o.create_at ?? 0),
    update_at: Number(o.updated_at ?? o.update_at ?? 0),
  }
}

/** 更新餐桌 body（与后端 UpdateTableReq 一致，id 仅走 URL） */
export interface UpdateTableBody {
  code: string
  status: string
  capacity: number
  category_id: string
  sort?: number
  qr_code?: string
}

export interface UpdateTableCategoryBody {
  name: string
  description: string
  sort: number
}

export async function listTableCategories(params?: { current?: number; pageSize?: number; name?: string }) {
  const { data } = await api.get<{ categories: unknown[]; total: number }>('/central/v1/table/categories', { params })
  const categories = Array.isArray(data?.categories) ? data.categories.map((c) => normalizeTableCategory(c)) : []
  return { ...data, categories, total: Number(data?.total) || 0 }
}

export async function createTableCategory(body: { name: string; description?: string; sort?: number }) {
  await api.post('/central/v1/table/category', body)
}

export async function getTableCategory(id: string) {
  const { data } = await api.get<{ category: TableCategory }>(`/central/v1/table/category/${id}`)
  return data
}

export async function updateTableCategory(id: string, body: UpdateTableCategoryBody) {
  await api.put(`/central/v1/table/category/${id}`, {
    category: {
      name: body.name,
      description: body.description ?? '',
      sort: Math.round(Number(body.sort ?? 0)),
    },
  })
}

export async function deleteTableCategory(id: string) {
  await api.delete(`/central/v1/table/category/${id}`)
}

export async function listTables(params?: {
  current?: number
  pageSize?: number
  code?: string
  /** 桌号模糊搜索，与后端 ListTableReq.name 一致 */
  name?: string
  status?: string
  category?: string
}) {
  const { data } = await api.get<{ tables: unknown[]; total: number }>('/central/v1/tables', { params })
  const tables = Array.isArray(data?.tables) ? data.tables.map((t) => normalizeTable(t)) : []
  return { ...data, tables, total: Number(data?.total) || 0 }
}

export async function createTable(body: {
  code: string
  status: string
  capacity: number
  category_id: string
  sort?: number
  qr_code?: string
}) {
  await api.post('/central/v1/tables', body)
}

export async function getTable(id: string) {
  const { data } = await api.get<{ table: unknown }>(`/central/v1/table/${id}`)
  return { table: normalizeTable(data?.table) }
}

export async function updateTable(id: string, body: UpdateTableBody) {
  await api.put(`/central/v1/table/${id}`, body)
}

export async function deleteTable(id: string) {
  await api.delete(`/central/v1/table/${id}`)
}
