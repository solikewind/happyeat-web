/**
 * 后端订单状态为 enum 大写（CREATED / PAID / …），前端统一用小写键做展示与样式。
 */

export function normOrderStatus(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/** 列表/工作台筛选参数：与数据库一致的大写 */
export function toApiOrderStatus(filter: string | undefined): string | undefined {
  if (filter == null || filter === '') return undefined
  return filter.trim().toUpperCase()
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  created: '待支付',
  paid: '已支付',
  preparing: '制作中',
  completed: '已完成',
  cancelled: '已取消',
}

export const ORDER_STATUS_TAG_COLOR: Record<string, string> = {
  created: 'default',
  paid: 'blue',
  preparing: 'processing',
  completed: 'success',
  cancelled: 'default',
}

export function orderStatusLabel(status: string | undefined): string {
  const k = normOrderStatus(status)
  return ORDER_STATUS_LABEL[k] ?? (typeof status === 'string' && status ? status : '-')
}

export function orderStatusTagColor(status: string | undefined): string {
  const k = normOrderStatus(status)
  return ORDER_STATUS_TAG_COLOR[k] ?? 'default'
}

/** 进行中：待支付 / 已付 / 制作中 */
const ACTIVE_ORDER_STATUSES = new Set(['created', 'paid', 'preparing'])

export function isActiveOrderStatus(status: unknown): boolean {
  return ACTIVE_ORDER_STATUSES.has(normOrderStatus(status))
}

/** 与后端 OrderType 一致（小写 dine_in / takeaway） */
export const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in: '堂食',
  takeaway: '打包外带',
}
