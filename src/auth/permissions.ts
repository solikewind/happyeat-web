export type PermissionKey = string
export type RoleKey = string

export interface PermissionApiMapping {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
}

export interface PermissionDefinition {
  key: PermissionKey
  module: string
  label: string
  scene: string
  apis: PermissionApiMapping[]
}

/** 前端路由/按钮守卫仍引用这些 key；与后端 casbinrules 权限码对齐 */
export const PERMISSION_DEFINITIONS: Record<string, PermissionDefinition> = {
  'permission:view': {
    key: 'permission:view',
    module: 'permission',
    label: '权限管理',
    scene: '角色与接口权限配置',
    apis: [],
  },
  'home:view': {
    key: 'home:view',
    module: 'home',
    label: '查看首页',
    scene: '首页概览与导航入口',
    apis: [],
  },
  'workbench:view': {
    key: 'workbench:view',
    module: 'workbench',
    label: '查看工作台',
    scene: '工作台订单列表',
    apis: [{ method: 'GET', path: '/central/v1/workbench/orders' }],
  },
  'workbench:complete': {
    key: 'workbench:complete',
    module: 'workbench',
    label: '工作台出单完成',
    scene: '工作台点击“出单完成”',
    apis: [{ method: 'PUT', path: '/central/v1/order/:id/status' }],
  },
  'orders:view': {
    key: 'orders:view',
    module: 'orders',
    label: '查看订单',
    scene: '订单管理列表/详情',
    apis: [
      { method: 'GET', path: '/central/v1/orders' },
      { method: 'GET', path: '/central/v1/order/:id' },
    ],
  },
  'orders:create': {
    key: 'orders:create',
    module: 'orders',
    label: '新建订单',
    scene: '订单管理新建订单',
    apis: [{ method: 'POST', path: '/central/v1/orders' }],
  },
  'orders:update': {
    key: 'orders:update',
    module: 'orders',
    label: '编辑订单明细',
    scene: '订单创建后追加菜品或修改备注',
    apis: [{ method: 'PUT', path: '/central/v1/order/:id' }],
  },
  'orders:update_status': {
    key: 'orders:update_status',
    module: 'orders',
    label: '更新订单状态',
    scene: '订单管理切换状态',
    apis: [{ method: 'PUT', path: '/central/v1/order/:id/status' }],
  },
  'orders:print_kitchen': {
    key: 'orders:print_kitchen',
    module: 'orders',
    label: '打印厨房小票',
    scene: '订单管理/工作台手动触发商鹏厨房单',
    apis: [{ method: 'POST', path: '/central/v1/order/:id/print' }],
  },
  'order_desk:view': {
    key: 'order_desk:view',
    module: 'order_desk',
    label: '查看点餐台',
    scene: '点餐台页面加载',
    apis: [
      { method: 'GET', path: '/central/v1/menu/categories' },
      { method: 'GET', path: '/central/v1/menus' },
      { method: 'GET', path: '/central/v1/tables' },
    ],
  },
  'order_desk:create': {
    key: 'order_desk:create',
    module: 'order_desk',
    label: '点餐台提交订单',
    scene: '点餐台点击“提交订单”',
    apis: [{ method: 'POST', path: '/central/v1/orders' }],
  },
  'menu:view': {
    key: 'menu:view',
    module: 'menu',
    label: '查看菜单管理',
    scene: '分类/菜品列表与详情',
    apis: [
      { method: 'GET', path: '/central/v1/menu/categories' },
      { method: 'GET', path: '/central/v1/menus' },
      { method: 'GET', path: '/central/v1/menu/:id' },
    ],
  },
  'menu:edit': {
    key: 'menu:edit',
    module: 'menu',
    label: '编辑菜单管理',
    scene: '分类/菜品新增、修改、删除',
    apis: [
      { method: 'POST', path: '/central/v1/menu/category' },
      { method: 'PUT', path: '/central/v1/menu/category/:id' },
      { method: 'DELETE', path: '/central/v1/menu/category/:id' },
      { method: 'POST', path: '/central/v1/menus' },
      { method: 'PUT', path: '/central/v1/menu/:id' },
      { method: 'DELETE', path: '/central/v1/menu/:id' },
    ],
  },
  'table:view': {
    key: 'table:view',
    module: 'table',
    label: '查看餐桌管理',
    scene: '餐桌分类/桌台列表与详情',
    apis: [
      { method: 'GET', path: '/central/v1/table/categories' },
      { method: 'GET', path: '/central/v1/tables' },
      { method: 'GET', path: '/central/v1/table/:id' },
    ],
  },
  'table:edit': {
    key: 'table:edit',
    module: 'table',
    label: '编辑餐桌管理',
    scene: '餐桌分类/桌台新增、修改、删除',
    apis: [
      { method: 'POST', path: '/central/v1/table/category' },
      { method: 'PUT', path: '/central/v1/table/category/:id' },
      { method: 'DELETE', path: '/central/v1/table/category/:id' },
      { method: 'POST', path: '/central/v1/tables' },
      { method: 'PUT', path: '/central/v1/table/:id' },
      { method: 'DELETE', path: '/central/v1/table/:id' },
    ],
  },
  'spec:view': {
    key: 'spec:view',
    module: 'spec',
    label: '查看规格模板',
    scene: '规格组/项只读',
    apis: [{ method: 'GET', path: '/central/v1/spec/groups' }],
  },
  'spec:edit': {
    key: 'spec:edit',
    module: 'spec',
    label: '编辑规格模板',
    scene: '规格组/项维护',
    apis: [{ method: 'POST', path: '/central/v1/spec/group' }],
  },
  'stats:view': {
    key: 'stats:view',
    module: 'stats',
    label: '查看订单统计',
    scene: '营业额、订单量与菜品销量',
    apis: [
      { method: 'GET', path: '/central/v1/stats/daily' },
      { method: 'GET', path: '/central/v1/stats/daily/overview' },
      { method: 'GET', path: '/central/v1/stats/menus' },
    ],
  },
}

const MODULE_LABELS: Record<string, string> = {
  permission: '权限',
  home: '首页',
  workbench: '工作台',
  orders: '订单',
  order_desk: '点餐台',
  menu: '菜单',
  table: '餐桌',
  spec: '规格',
  stats: '订单统计',
}

export function permissionModuleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module
}

export function permissionLabel(code: string): string {
  return PERMISSION_DEFINITIONS[code]?.label ?? code
}

const ALL_PERMISSIONS: PermissionKey[] = Object.keys(PERMISSION_DEFINITIONS)

const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  super_admin: [...ALL_PERMISSIONS],
  manager: [...ALL_PERMISSIONS],
  cashier: [
    'home:view',
    'orders:view',
    'orders:create',
    'orders:update',
    'orders:print_kitchen',
    'order_desk:view',
    'order_desk:create',
    'stats:view',
    'spec:view',
  ],
  kitchen: [
    'home:view',
    'workbench:view',
    'workbench:complete',
    'orders:view',
    'orders:print_kitchen',
    'spec:view',
  ],
  waiter: [
    'home:view',
    'orders:view',
    'orders:update',
    'orders:print_kitchen',
    'order_desk:view',
    'order_desk:create',
    'table:view',
    'spec:view',
  ],
  unknown: [],
}

const ROLE_PERMISSION_STORAGE_KEY = 'happyeat_role_permissions'

export const DEFAULT_ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  manager: '店长',
  cashier: '收银',
  kitchen: '后厨',
  waiter: '服务员',
  unknown: '未知角色',
}

let runtimeRolePermissions: Record<string, PermissionKey[]> = loadRolePermissions()
let runtimeRoleLabels: Record<string, string> = { ...DEFAULT_ROLE_LABELS }

export const ROLE_LABELS: Record<string, string> = { ...DEFAULT_ROLE_LABELS }

export function getRoleLabel(role: string): string {
  return runtimeRoleLabels[role] ?? DEFAULT_ROLE_LABELS[role] ?? role
}

export function normalizeRole(role?: string | null): RoleKey {
  if (!role) return 'unknown'
  const safeRole = role.trim().toLowerCase()
  if (safeRole in runtimeRolePermissions) return safeRole
  return 'unknown'
}

export function getRolePermissions(role?: string | null): PermissionKey[] {
  return runtimeRolePermissions[normalizeRole(role)] ?? []
}

export function hasPermission(role: string | null | undefined, permission: PermissionKey): boolean {
  return getRolePermissions(role).includes(permission)
}

export function getRolePermissionConfig() {
  return { ...runtimeRolePermissions }
}

/** 合并后端角色权限矩阵与展示名（支持动态自定义角色） */
export function applyRemoteRoleConfig(
  matrix: Array<{ role: string; permissions: string[] }>,
  roles?: Array<{ role_code: string; role_name: string }>,
) {
  const next = { ...runtimeRolePermissions }
  for (const row of matrix) {
    if (!row?.role) continue
    next[row.role] = filterPermissionKeys(row.permissions ?? [])
  }
  runtimeRolePermissions = next
  if (roles?.length) {
    const labels = { ...runtimeRoleLabels }
    for (const r of roles) {
      if (r.role_code) labels[r.role_code] = r.role_name?.trim() || r.role_code
    }
    runtimeRoleLabels = labels
    Object.assign(ROLE_LABELS, labels)
  }
  persistRolePermissions(runtimeRolePermissions)
}

export function updateRolePermissions(role: RoleKey, permissions: PermissionKey[]) {
  runtimeRolePermissions = {
    ...runtimeRolePermissions,
    [role]: filterPermissionKeys(permissions),
  }
  persistRolePermissions(runtimeRolePermissions)
}

export function resetRolePermissions(role?: RoleKey) {
  if (role) {
    runtimeRolePermissions = {
      ...runtimeRolePermissions,
      [role]: [...(DEFAULT_ROLE_PERMISSIONS[role] ?? [])],
    }
  } else {
    runtimeRolePermissions = cloneDefaults()
  }
  persistRolePermissions(runtimeRolePermissions)
}

function filterPermissionKeys(keys: string[]): PermissionKey[] {
  const catalog = new Set(ALL_PERMISSIONS)
  return Array.from(new Set(keys)).filter((k) => catalog.has(k))
}

function loadRolePermissions(): Record<string, PermissionKey[]> {
  if (typeof window === 'undefined') return cloneDefaults()
  try {
    const raw = window.localStorage.getItem(ROLE_PERMISSION_STORAGE_KEY)
    if (!raw) return cloneDefaults()
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const base = cloneDefaults()
    Object.keys(parsed).forEach((role) => {
      const value = parsed[role]
      if (!Array.isArray(value)) return
      const cached = value.filter(
        (item): item is PermissionKey => typeof item === 'string' && ALL_PERMISSIONS.includes(item),
      )
      const defaults = DEFAULT_ROLE_PERMISSIONS[role as RoleKey] ?? []
      if (defaults.length === ALL_PERMISSIONS.length) {
        base[role] = [...ALL_PERMISSIONS]
        return
      }
      base[role] = Array.from(new Set([...cached, ...defaults]))
    })
    return base
  } catch {
    return cloneDefaults()
  }
}

function persistRolePermissions(config: Record<string, PermissionKey[]>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ROLE_PERMISSION_STORAGE_KEY, JSON.stringify(config))
}

function cloneDefaults(): Record<string, PermissionKey[]> {
  const out: Record<string, PermissionKey[]> = { unknown: [] }
  Object.entries(DEFAULT_ROLE_PERMISSIONS).forEach(([role, perms]) => {
    out[role] = [...perms]
  })
  return out
}
