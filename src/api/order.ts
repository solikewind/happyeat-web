import { api } from './client'
import type { Order, OrderItem } from './types'
import { normOrderStatus, toApiOrderStatus } from '../utils/orderStatus'

export interface CreateOrderItem {
  menu_name: string
  quantity: number
  unit_price: number
  spec_info?: string
}

export interface UpdateOrderItem {
  menu_id: string
  quantity: number
  spec_info?: string
}

function normalizeOrderItem(item: OrderItem): OrderItem {
  const raw = item as OrderItem & { menu_id?: string | number }
  return {
    ...item,
    menu_id: raw.menu_id != null && String(raw.menu_id) !== '' ? String(raw.menu_id) : undefined,
  }
}

/** 统一为前端使用的小写状态，避免各处再做大写兼容 */
function normalizeOrder(order: Order): Order {
  const s = normOrderStatus(order.status)
  return {
    ...order,
    status: s || order.status,
    actual_amount: order.actual_amount ?? 0,
    items: Array.isArray(order.items) ? order.items.map(normalizeOrderItem) : order.items,
  }
}

const normalizeOrderList = (data: { orders?: Order[]; total?: number } | undefined) => ({
  orders: (Array.isArray(data?.orders) ? data.orders : []).map(normalizeOrder),
  total: Number(data?.total) || 0,
})

function withApiStatus<T extends { status?: string }>(params: T): T {
  return { ...params, status: toApiOrderStatus(params.status) as string | undefined }
}

export async function listOrders(params?: {
  current?: number
  pageSize?: number
  status?: string
  order_type?: string
  table_id?: string
}) {
  const query = params ? withApiStatus(params) : undefined
  const { data } = await api.get<{ orders: Order[]; total: number }>('/central/v1/orders', { params: query })
  return normalizeOrderList(data)
}

export async function getOrder(id: string) {
  const { data } = await api.get<{ order: Order }>(`/central/v1/order/${id}`)
  return { ...data, order: data.order ? normalizeOrder(data.order) : data.order }
}

export async function createOrder(body: {
  order_type: string
  table_id?: string
  items: CreateOrderItem[]
  total_amount: number
  /** 实收（分）；不传时由调用方决定是否省略（后端默认 0） */
  actual_amount?: number
  remark?: string
}) {
  const { data } = await api.post<{ order: Order }>('/central/v1/orders', body)
  return { ...data, order: data.order ? normalizeOrder(data.order) : data.order }
}

/** 入参可为小写（与界面一致），请求体统一为大写以匹配后端 enum */
export async function updateOrderStatus(id: string, status: string) {
  const next = toApiOrderStatus(status) ?? status
  await api.put(`/central/v1/order/${id}/status`, { status: next })
}

export async function updateOrder(id: string, body: { items: UpdateOrderItem[]; remark?: string }) {
  const { data } = await api.put<{ order: Order }>(`/central/v1/order/${id}`, body)
  return { ...data, order: data.order ? normalizeOrder(data.order) : data.order }
}

/** 手动触发商鹏厨房小票（与自动打印同模板，标题为「手动打印」） */
export async function printOrderKitchen(id: string) {
  await api.post(`/central/v1/order/${id}/print`)
}

export async function listWorkbenchOrders(params?: { current?: number; pageSize?: number; status?: string }) {
  const query = params ? withApiStatus(params) : undefined
  const { data } = await api.get<{ orders: Order[]; total: number }>('/central/v1/workbench/orders', { params: query })
  return normalizeOrderList(data)
}
