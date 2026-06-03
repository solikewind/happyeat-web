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

/** 工作台卡片排序：制作中 → 已支付 → 待支付 */
export const WORKBENCH_STATUS_PRIORITY: Record<string, number> = {
  preparing: 0,
  paid: 1,
  created: 2,
  completed: 3,
  cancelled: 4,
}

export function compareWorkbenchOrderStatus(a: unknown, b: unknown): number {
  const pa = WORKBENCH_STATUS_PRIORITY[normOrderStatus(a)] ?? 99
  const pb = WORKBENCH_STATUS_PRIORITY[normOrderStatus(b)] ?? 99
  return pa - pb
}

/** 工作台主操作：与后端状态机一致（paid→preparing，preparing→completed） */
export type WorkbenchAdvanceStatus = 'preparing' | 'completed'

export function workbenchAdvanceStatus(status: unknown): WorkbenchAdvanceStatus | null {
  const k = normOrderStatus(status)
  if (k === 'paid') return 'preparing'
  if (k === 'preparing') return 'completed'
  return null
}

export const WORKBENCH_STATUS_HINT: Record<string, string> = {
  created: '未收款，请前台确认支付后再出餐',
  paid: '已收款，可开始制作',
  preparing: '制作完成后点击出单',
  completed: '本单已出餐完成',
  cancelled: '订单已取消',
}
