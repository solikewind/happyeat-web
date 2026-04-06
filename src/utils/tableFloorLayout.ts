const STORAGE_KEY = 'happyeat_table_floor_layout_v1'

export interface FloorPosition {
  x: number
  y: number
}

export type FloorLayoutMap = Record<string, FloorPosition>

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function defaultFloorPosition(index: number, total: number): FloorPosition {
  if (total <= 0) return { x: 50, y: 50 }
  const cols = Math.max(1, Math.ceil(Math.sqrt(total)))
  const rows = Math.ceil(total / cols)
  const row = Math.floor(index / cols)
  const col = index % cols
  return {
    x: clamp(((col + 0.5) / cols) * 88 + 6, 8, 92),
    y: clamp(((row + 0.5) / rows) * 82 + 9, 8, 92),
  }
}

export function loadFloorLayout(): FloorLayoutMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: FloorLayoutMap = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const id = String(k)
      if (!v || typeof v !== 'object') continue
      const pos = v as { x?: unknown; y?: unknown }
      const x = Number(pos.x)
      const y = Number(pos.y)
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue
      out[id] = { x: clamp(x, 4, 96), y: clamp(y, 4, 96) }
    }
    return out
  } catch {
    return {}
  }
}

export function saveFloorLayout(map: FloorLayoutMap, validTableIds: Set<string>) {
  if (typeof window === 'undefined') return
  const filtered: FloorLayoutMap = {}
  for (const [key, pos] of Object.entries(map)) {
    const id = String(key)
    if (!validTableIds.has(id)) continue
    filtered[id] = { x: clamp(pos.x, 4, 96), y: clamp(pos.y, 4, 96) }
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function mergePositionsWithTables<T extends { id: string }>(
  tables: T[],
  prev: Record<string, FloorPosition>
): Record<string, FloorPosition> {
  const saved = loadFloorLayout()
  const next: Record<string, FloorPosition> = {}
  tables.forEach((t, i) => {
    const tid = String(t.id)
    const fromDisk = saved[tid]
    next[tid] = prev[tid] ?? fromDisk ?? defaultFloorPosition(i, tables.length)
  })
  return next
}

/** 忽略本地已存布局，按桌台列表重新网格排布 */
export function buildDefaultLayoutForTables<T extends { id: string }>(tables: T[]): Record<string, FloorPosition> {
  const next: Record<string, FloorPosition> = {}
  tables.forEach((t, i) => {
    next[String(t.id)] = defaultFloorPosition(i, tables.length)
  })
  return next
}
