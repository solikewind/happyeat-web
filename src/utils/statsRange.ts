export type StatsRangePreset = 'today' | 'yesterday' | '7d' | '30d' | 'custom'

const pad = (n: number) => String(n).padStart(2, '0')

/** 格式化为 YYYY-MM-DD（本地自然日） */
export function formatStatsDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatStatsDateChinese(dateStr: string, withYear = true): string {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return dateStr
  return withYear ? `${year}年${month}月${day}日` : `${month}月${day}日`
}

export function formatStatsDateRangeChinese(start: string, end: string): string {
  if (start === end) return formatStatsDateChinese(start)
  return `${formatStatsDateChinese(start)} ~ ${formatStatsDateChinese(end)}`
}

export function resolveStatsRange(preset: StatsRangePreset, custom?: [Date, Date] | null): {
  start_date: string
  end_date: string
  label: string
} {
  const today = startOfDay(new Date())
  if (preset === 'custom' && custom?.[0] && custom?.[1]) {
    const start = startOfDay(custom[0])
    const end = startOfDay(custom[1])
    const s = start <= end ? start : end
    const e = start <= end ? end : start
    return {
      start_date: formatStatsDate(s),
      end_date: formatStatsDate(e),
      label: formatStatsDateRangeChinese(formatStatsDate(s), formatStatsDate(e)),
    }
  }

  const end = today
  let start = today
  let label = '今天'

  switch (preset) {
    case 'yesterday': {
      const y = startOfDay(new Date(today))
      y.setDate(y.getDate() - 1)
      return {
        start_date: formatStatsDate(y),
        end_date: formatStatsDate(y),
        label: '昨天',
      }
    }
    case '7d':
      start = startOfDay(new Date(today))
      start.setDate(start.getDate() - 6)
      label = '近七天'
      break
    case '30d':
      start = startOfDay(new Date(today))
      start.setDate(start.getDate() - 29)
      label = '30天'
      break
    default:
      break
  }

  return {
    start_date: formatStatsDate(start),
    end_date: formatStatsDate(end),
    label,
  }
}

export function formatDayLabel(dateStr: string): string {
  return formatStatsDateChinese(dateStr, false)
}

export function formatYuan(amount: number): string {
  return `¥${Number(amount || 0).toFixed(2)}`
}
