/**
 * 菜单匹配工具
 * 用于将语音识别的文本匹配到菜单项
 */

import type { Menu } from '../api/types'

/**
 * 模糊匹配菜单名称
 * @param text 识别的文本
 * @param menus 菜单列表
 * @returns 匹配的菜单列表（按匹配度排序）
 */
export function matchMenuByText(text: string, menus: Menu[]): Menu[] {
  if (!text || !menus.length) return []

  const normalizedText = text.trim().toLowerCase().replace(/\s+/g, '')

  // 计算匹配分数
  const scored = menus.map((menu) => {
    const menuName = menu.name.toLowerCase().replace(/\s+/g, '')
    let score = 0

    // 完全匹配
    if (menuName === normalizedText) {
      score = 100
    }
    // 包含匹配
    else if (menuName.includes(normalizedText) || normalizedText.includes(menuName)) {
      score = 80
      // 计算相似度
      const similarity = calculateSimilarity(normalizedText, menuName)
      score = Math.max(score, similarity * 100)
    }
    // 部分匹配（至少3个字符）
    else if (normalizedText.length >= 3) {
      const commonChars = getCommonChars(normalizedText, menuName)
      if (commonChars.length >= 3) {
        score = 50 + (commonChars.length / Math.max(normalizedText.length, menuName.length)) * 30
      }
    }

    return { menu, score }
  })

  // 过滤并排序
  return scored
    .filter((item) => item.score > 30) // 最低匹配度阈值
    .sort((a, b) => b.score - a.score)
    .map((item) => item.menu)
}

/**
 * 计算两个字符串的相似度（Levenshtein 距离的变体）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * 计算 Levenshtein 距离
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1, // 插入
          matrix[i - 1][j] + 1 // 删除
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * 获取两个字符串的公共字符
 */
function getCommonChars(str1: string, str2: string): string {
  const chars1 = str1.split('')
  const chars2 = str2.split('')
  const common: string[] = []

  for (const char of chars1) {
    const index = chars2.indexOf(char)
    if (index !== -1) {
      common.push(char)
      chars2.splice(index, 1) // 避免重复匹配
    }
  }

  return common.join('')
}

/**
 * 从语音文本中提取数量和菜单名称
 * @param text 识别的文本，如 "来两份宫保鸡丁"、"要一个红烧肉"
 * @returns { quantity: number, menuName: string }
 */
export function parseOrderText(text: string): { quantity: number; menuName: string } {
  const quantityMap: Record<string, number> = {
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
    十: 10,
    一份: 1,
    两份: 2,
    两分: 2,
    三分: 3,
    四分: 4,
    五分: 5,
    六分: 6,
    七分: 7,
    八分: 8,
    九分: 9,
    十分: 10,
    一个: 1,
    两个: 2,
    三个: 3,
    四个: 4,
    五个: 5,
    六个: 6,
    七个: 7,
    八个: 8,
    九个: 9,
    十个: 10,
  }

  let quantity = 1
  let menuName = text.trim()

  // 尝试提取数量
  for (const [key, value] of Object.entries(quantityMap)) {
    if (text.includes(key)) {
      quantity = value
      menuName = text.replace(new RegExp(key, 'g'), '').trim()
      break
    }
  }

  // 移除常见的前缀和后缀
  menuName = menuName
    .replace(/^(来|要|点|加|上|来一份|来一个|要一份|要一个|点一份|点一个)/, '')
    .replace(/(一份|一个|份|个|菜|道)$/, '')
    .trim()

  return { quantity, menuName }
}
