import type { Menu } from '../api/types'

export interface ParsedOrderItem {
  quantity: number
  menuName: string
}

const ACTION_PREFIX_RE =
  /^(来|要|点|加|再来|再要|再点|再加|给我|帮我|请|麻烦|想要|我要|我想要|我想点|来个|来份|来一份|要个|要一份)+/g
const ITEM_SPLIT_RE = /(?:,|，|。|；|;|然后|再来|再要|再点|再加|外加|另外|还有|加上|并且|并|和)/g
const UNIT_RE = '(?:份|个|碗|盘|杯|瓶|扎|听|串|份儿)?'

export function matchMenuByText(text: string, menus: Menu[]): Menu[] {
  if (!text || !menus.length) return []

  const normalizedText = text.trim().toLowerCase().replace(/\s+/g, '')

  const scored = menus.map((menu) => {
    const menuName = menu.name.toLowerCase().replace(/\s+/g, '')
    let score = 0

    if (menuName === normalizedText) {
      score = 100
    } else if (menuName.includes(normalizedText) || normalizedText.includes(menuName)) {
      score = 80
      const similarity = calculateSimilarity(normalizedText, menuName)
      score = Math.max(score, similarity * 100)
    } else if (normalizedText.length >= 3) {
      const commonChars = getCommonChars(normalizedText, menuName)
      if (commonChars.length >= 3) {
        score = 50 + (commonChars.length / Math.max(normalizedText.length, menuName.length)) * 30
      }
    }

    return { menu, score }
  })

  return scored
    .filter((item) => item.score > 30)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.menu)
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i += 1) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j += 1) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i += 1) {
    for (let j = 1; j <= str1.length; j += 1) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }

  return matrix[str2.length][str1.length]
}

function getCommonChars(str1: string, str2: string): string {
  const chars1 = str1.split('')
  const chars2 = str2.split('')
  const common: string[] = []

  for (const char of chars1) {
    const index = chars2.indexOf(char)
    if (index !== -1) {
      common.push(char)
      chars2.splice(index, 1)
    }
  }

  return common.join('')
}

function chineseNumberToInt(text: string): number {
  const digitMap: Record<string, number> = {
    零: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  }

  let total = 0
  let current = 0

  for (const char of text) {
    if (char === '十') {
      total += (current || 1) * 10
      current = 0
      continue
    }
    if (char === '百') {
      total += (current || 1) * 100
      current = 0
      continue
    }

    if (char in digitMap) {
      current = digitMap[char]
    }
  }

  const value = total + current
  return value > 0 ? value : 1
}

function parseQuantityAndName(rawText: string): ParsedOrderItem | null {
  const text = rawText
    .replace(/\s+/g, '')
    .replace(ACTION_PREFIX_RE, '')
    .replace(/^(来点|来份|要点|点个|点份)/, '')
    .trim()

  if (!text) return null

  let quantity = 1
  let menuName = text

  const arabicMatch = menuName.match(new RegExp(`(\\d+)${UNIT_RE}`))
  if (arabicMatch && arabicMatch[1]) {
    quantity = Math.max(1, Number(arabicMatch[1]))
    menuName = menuName.replace(arabicMatch[0], '')
  } else {
    const chineseMatch = menuName.match(new RegExp(`([零一二两三四五六七八九十百]+)${UNIT_RE}`))
    if (chineseMatch && chineseMatch[1]) {
      quantity = chineseNumberToInt(chineseMatch[1])
      menuName = menuName.replace(chineseMatch[0], '')
    }
  }

  menuName = menuName
    .replace(/^(的|来|要|点|加)/, '')
    .replace(/(一份|一個|一个|份|个|菜|谢谢|吧|啊|呀)$/g, '')
    .trim()

  if (!menuName) return null

  return {
    quantity: Math.min(99, Math.max(1, quantity)),
    menuName,
  }
}

export function parseOrderItems(text: string): ParsedOrderItem[] {
  const raw = text.trim()
  if (!raw) return []

  const chunks = raw.split(ITEM_SPLIT_RE).map((item) => item.trim()).filter(Boolean)
  const parsed = chunks.map(parseQuantityAndName).filter((item): item is ParsedOrderItem => Boolean(item))

  if (!parsed.length) {
    const fallback = parseQuantityAndName(raw)
    return fallback ? [fallback] : []
  }

  const merged = new Map<string, ParsedOrderItem>()
  parsed.forEach((item) => {
    const key = item.menuName.toLowerCase()
    const existing = merged.get(key)
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + item.quantity)
    } else {
      merged.set(key, { ...item })
    }
  })

  return Array.from(merged.values())
}

export function parseOrderText(text: string): { quantity: number; menuName: string } {
  const items = parseOrderItems(text)
  if (!items.length) {
    return { quantity: 1, menuName: text.trim() }
  }
  return items[0]
}
