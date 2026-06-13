import { api } from './client'

export interface DailyStatsPoint {
  date: string
  order_count: number
  revenue: number
  item_count: number
  dine_in_count?: number
  takeaway_count?: number
}

export interface DailyStatsSummary {
  order_count: number
  revenue: number
  item_count: number
  dine_in_count?: number
  takeaway_count?: number
}

export interface ListDailyStatsReply {
  daily: DailyStatsPoint[]
  summary: DailyStatsSummary
}

export interface MenuStatsRow {
  menu_name: string
  spec_info?: string
  quantity: number
  amount: number
}

export interface ListMenuStatsReply {
  rows: MenuStatsRow[]
}

export async function getDailyStatsOverview() {
  const { data } = await api.get<ListDailyStatsReply>('/central/v1/stats/daily/overview')
  return data
}

export async function listDailyStats(params?: { start_date?: string; end_date?: string }) {
  const { data } = await api.get<ListDailyStatsReply>('/central/v1/stats/daily', { params })
  return data
}

export async function listMenuStats(params?: { start_date?: string; end_date?: string }) {
  const { data } = await api.get<ListMenuStatsReply>('/central/v1/stats/menus', { params })
  return data
}
