import type { Menu, MenuCategory } from '../api/types'

function compareId(a: string, b: string): number {
  const idA = Number.parseInt(a, 10)
  const idB = Number.parseInt(b, 10)
  if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) return idA - idB
  return a.localeCompare(b)
}

/** 分类列表/Tab 排序：仅按 sort，再按 id（不按菜品/酒水类型）。 */
export function sortMenuCategoriesForDisplay(list: MenuCategory[]): MenuCategory[] {
  return [...list].sort((a, b) => {
    const sortA = a.sort ?? 0
    const sortB = b.sort ?? 0
    if (sortA !== sortB) return sortA - sortB
    return compareId(String(a.id), String(b.id))
  })
}

export type SortMenusOptions = {
  /** 「全部」或全局搜索时为 true：先按分类 sort 再按菜品 sort */
  groupByCategory?: boolean
}

/** 菜单浏览排序（点餐台/菜单管理）；不按菜品/酒水类型，仅按 sort。 */
export function sortMenusForDisplay(
  list: Menu[],
  categories: MenuCategory[],
  options?: SortMenusOptions,
): Menu[] {
  if (list.length <= 1) return list

  const groupByCategory = options?.groupByCategory ?? false
  const catById = new Map(categories.map((c) => [c.id, c]))
  const catNameById = new Map(categories.map((c) => [c.id, c.name]))

  return [...list].sort((a, b) => {
    if (groupByCategory) {
      const catA = catById.get(a.category_id)
      const catB = catById.get(b.category_id)

      const catSortA = catA?.sort ?? Number.MAX_SAFE_INTEGER
      const catSortB = catB?.sort ?? Number.MAX_SAFE_INTEGER
      if (catSortA !== catSortB) return catSortA - catSortB

      const nameCmp = (catNameById.get(a.category_id) ?? '').localeCompare(
        catNameById.get(b.category_id) ?? '',
        'zh-CN',
      )
      if (nameCmp !== 0) return nameCmp
    }

    const menuSortA = a.sort ?? 0
    const menuSortB = b.sort ?? 0
    if (menuSortA !== menuSortB) return menuSortA - menuSortB

    return compareId(String(a.id), String(b.id))
  })
}
