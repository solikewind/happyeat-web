import type { Menu, MenuCategory, OrderItem } from '../api/types'

const DRINK_NAME_KEYWORDS = ['酒水', '饮料', '饮品', '酒水饮料', '啤酒', '红酒', '白酒']

function inferDrinkCategoryName(name?: string): boolean {
  const n = (name ?? '').trim()
  if (!n) return false
  return DRINK_NAME_KEYWORDS.some((kw) => n.includes(kw))
}

/** 订单/打印专用：菜品类=0 靠前，酒水饮料类=1 靠后。 */
function categoryKindRank(cat?: MenuCategory): number {
  if (!cat) return 0
  if (cat.kind === 'drink') return 1
  if (inferDrinkCategoryName(cat.name)) return 1
  return 0
}

/** 订单明细展示排序：菜品类靠前，酒水饮料类靠后（与后端 display_sort 规则一致）。 */
export function sortOrderItemsForDisplay(
  items: OrderItem[],
  menus: Menu[],
  categories: MenuCategory[],
): OrderItem[] {
  if (items.length <= 1) return items

  const catById = new Map(categories.map((c) => [c.id, c]))
  const menuById = new Map(menus.map((m) => [m.id, m]))
  const menuByName = new Map<string, Menu>()
  for (const menu of menus) {
    if (!menuByName.has(menu.name)) menuByName.set(menu.name, menu)
  }

  const resolveMenu = (item: OrderItem): Menu | undefined => {
    if (item.menu_id) return menuById.get(item.menu_id)
    return menuByName.get(item.menu_name)
  }

  const rankedItems = items.map((item, index) => {
    const menu = resolveMenu(item)
    const category = menu ? catById.get(menu.category_id) : undefined
    return {
      item,
      index,
      kind: categoryKindRank(category),
      categorySort: category?.sort ?? 0,
      menuSort: menu?.sort ?? 0,
      groupName: (menu?.name || item.menu_name || '').trim(),
      groupRank: 0,
    }
  })

  const baseSorted = [...rankedItems].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind - b.kind
    if (a.categorySort !== b.categorySort) return a.categorySort - b.categorySort
    if (a.menuSort !== b.menuSort) return a.menuSort - b.menuSort
    return a.index - b.index
  })
  const groupRankByName = new Map<string, number>()
  baseSorted.forEach((entry, rank) => {
    const groupKey = `${entry.kind}|${entry.categorySort}|${entry.groupName}`
    if (!groupRankByName.has(groupKey)) groupRankByName.set(groupKey, rank)
  })

  return rankedItems
    .map((entry) => ({
      ...entry,
      groupRank: groupRankByName.get(`${entry.kind}|${entry.categorySort}|${entry.groupName}`) ?? entry.index,
    }))
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind - b.kind
      if (a.categorySort !== b.categorySort) return a.categorySort - b.categorySort
      if (a.groupRank !== b.groupRank) return a.groupRank - b.groupRank
      if (a.menuSort !== b.menuSort) return a.menuSort - b.menuSort
      return a.index - b.index
    })
    .map(({ item }) => item)
}
