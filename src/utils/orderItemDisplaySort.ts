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

  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const menuA = resolveMenu(a.item)
      const menuB = resolveMenu(b.item)
      const catA = menuA ? catById.get(menuA.category_id) : undefined
      const catB = menuB ? catById.get(menuB.category_id) : undefined

      const kindA = categoryKindRank(catA)
      const kindB = categoryKindRank(catB)
      if (kindA !== kindB) return kindA - kindB

      const catSortA = catA?.sort ?? 0
      const catSortB = catB?.sort ?? 0
      if (catSortA !== catSortB) return catSortA - catSortB

      const menuSortA = menuA?.sort ?? 0
      const menuSortB = menuB?.sort ?? 0
      if (menuSortA !== menuSortB) return menuSortA - menuSortB

      return a.index - b.index
    })
    .map(({ item }) => item)
}
