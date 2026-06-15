import { api } from './client'
import { normalizeOrder } from './order'
import type { Order, Settlement } from './types'

function normalizeSettlement(raw: Settlement): Settlement {
  const orders = Array.isArray(raw.orders) ? raw.orders.map((o) => normalizeOrder(o)) : []
  return {
    ...raw,
    id: String(raw.id),
    total_amount: raw.total_amount ?? 0,
    actual_amount: raw.actual_amount ?? 0,
    order_count: raw.order_count ?? orders.length,
    orders,
  }
}

function unwrapSettlement(data: unknown): Settlement | undefined {
  if (!data || typeof data !== 'object') return undefined
  const body = data as Record<string, unknown>
  if (body.settlement && typeof body.settlement === 'object') {
    return normalizeSettlement(body.settlement as Settlement)
  }
  if (body.id != null && body.customer_name != null) {
    return normalizeSettlement(body as unknown as Settlement)
  }
  return undefined
}

export async function listSettlements(params?: {
  current?: number
  pageSize?: number
  status?: 'UNSETTLED' | 'SETTLED'
  customer_name?: string
}) {
  const { data } = await api.get<{ settlements: Settlement[]; total: number }>('/central/v1/settlements', {
    params,
  })
  return {
    settlements: (Array.isArray(data?.settlements) ? data.settlements : []).map(normalizeSettlement),
    total: Number(data?.total) || 0,
  }
}

export async function getSettlement(id: string) {
  const { data } = await api.get(`/central/v1/settlement/${id}`)
  const settlement = unwrapSettlement(data)
  if (!settlement) {
    throw new Error('结账单响应格式异常')
  }
  return { settlement }
}

export async function createSettlement(body: { customer_name: string; remark?: string }) {
  const { data } = await api.post('/central/v1/settlements', body)
  const settlement = unwrapSettlement(data)
  if (!settlement) {
    throw new Error('结账单响应格式异常')
  }
  return { settlement }
}

export async function addSettlementOrder(settlementId: string, orderId: string) {
  const { data } = await api.post(`/central/v1/settlement/${settlementId}/orders`, {
    order_id: String(orderId),
  })
  const settlement = unwrapSettlement(data)
  if (!settlement) {
    throw new Error('结账单响应格式异常')
  }
  return { settlement }
}

/** 方案 A：逐笔调用现有加单接口；遇错即停，抛出 err.addedCount 表示已成功笔数 */
export async function addSettlementOrdersSequential(
  settlementId: string,
  orderIds: string[],
): Promise<{ addedCount: number; settlement?: Settlement }> {
  let addedCount = 0
  let settlement: Settlement | undefined
  for (const orderId of orderIds) {
    try {
      const res = await addSettlementOrder(settlementId, orderId)
      settlement = res.settlement
      addedCount++
    } catch (err) {
      throw Object.assign(err instanceof Error ? err : new Error('加入订单失败'), { addedCount, settlement })
    }
  }
  return { addedCount, settlement }
}

export async function removeSettlementOrder(settlementId: string, orderId: string) {
  const { data } = await api.delete(`/central/v1/settlement/${settlementId}/orders/${orderId}`)
  const settlement = unwrapSettlement(data)
  if (!settlement) {
    throw new Error('结账单响应格式异常')
  }
  return { settlement }
}

export async function settleSettlement(settlementId: string, body: { actual_amount: number; remark?: string }) {
  const { data } = await api.post(`/central/v1/settlement/${settlementId}/settle`, body)
  const settlement = unwrapSettlement(data)
  if (!settlement) {
    throw new Error('结账单响应格式异常')
  }
  return { settlement }
}

export type { Settlement, Order }
