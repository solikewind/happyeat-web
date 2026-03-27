export type PermissionKey =
  | 'permission:view'
  | 'home:view'
  | 'workbench:view'
  | 'workbench:complete'
  | 'orders:view'
  | 'orders:create'
  | 'orders:update_status'
  | 'order_desk:view'
  | 'order_desk:create'
  | 'menu:view'
  | 'menu:edit'
  | 'table:view'
  | 'table:edit'

export type RoleKey = 'super_admin' | 'manager' | 'cashier' | 'kitchen' | 'waiter' | 'unknown'

export interface PermissionApiMapping {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
}

export interface PermissionDefinition {
  key: PermissionKey
  module: 'home' | 'workbench' | 'orders' | 'order_desk' | 'menu' | 'table'
  label: string
  scene: string
  apis: PermissionApiMapping[]
}

export const PERMISSION_DEFINITIONS: Record<PermissionKey, PermissionDefinition> = {
  'permission:view': {
    key: 'permission:view',
    module: 'home',
    label: '查看权限管理',
    scene: '权限管理页面访问',
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
  'orders:update_status': {
    key: 'orders:update_status',
    module: 'orders',
    label: '更新订单状态',
    scene: '订单管理切换状态',
    apis: [{ method: 'PUT', path: '/central/v1/order/:id/status' }],
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
}

const ALL_PERMISSIONS: PermissionKey[] = [
  'permission:view',
  'home:view',
  'workbench:view',
  'workbench:complete',
  'orders:view',
  'orders:create',
  'orders:update_status',
  'order_desk:view',
  'order_desk:create',
  'menu:view',
  'menu:edit',
  'table:view',
  'table:edit',
]

const DEFAULT_ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  super_admin: ALL_PERMISSIONS,
  manager: ALL_PERMISSIONS,
  cashier: ['home:view', 'orders:view', 'orders:create', 'order_desk:view', 'order_desk:create'],
  kitchen: ['home:view', 'workbench:view', 'workbench:complete', 'orders:view'],
  waiter: ['home:view', 'orders:view', 'order_desk:view', 'order_desk:create', 'table:view'],
  unknown: [],
}

const ROLE_PERMISSION_STORAGE_KEY = 'happyeat_role_permissions'

let runtimeRolePermissions: Record<RoleKey, PermissionKey[]> = loadRolePermissions()

export const ROLE_LABELS: Record<RoleKey, string> = {
  super_admin: '超级管理员',
  manager: '店长',
  cashier: '收银',
  kitchen: '后厨',
  waiter: '服务员',
  unknown: '未知角色',
}

export function normalizeRole(role?: string | null): RoleKey {
  if (!role) return 'unknown'
  const safeRole = role.trim().toLowerCase()
  if (safeRole in runtimeRolePermissions) return safeRole as RoleKey
  return 'unknown'
}

export function getRolePermissions(role?: string | null): PermissionKey[] {
  return runtimeRolePermissions[normalizeRole(role)]
}

export function hasPermission(role: string | null | undefined, permission: PermissionKey): boolean {
  return getRolePermissions(role).includes(permission)
}

export function getRolePermissionMatrix() {
  return (Object.keys(runtimeRolePermissions) as RoleKey[]).map((role) => {
    const permissions = runtimeRolePermissions[role]
    return {
      role,
      roleLabel: ROLE_LABELS[role],
      permissions,
    }
  })
}

export function getRolePermissionConfig() {
  return { ...runtimeRolePermissions }
}

export function updateRolePermissions(role: RoleKey, permissions: PermissionKey[]) {
  const deduped = Array.from(new Set(permissions)).filter((item): item is PermissionKey => item in PERMISSION_DEFINITIONS)
  runtimeRolePermissions = {
    ...runtimeRolePermissions,
    [role]: deduped,
  }
  persistRolePermissions(runtimeRolePermissions)
}

export function resetRolePermissions(role?: RoleKey) {
  if (role) {
    runtimeRolePermissions = {
      ...runtimeRolePermissions,
      [role]: [...DEFAULT_ROLE_PERMISSIONS[role]],
    }
  } else {
    runtimeRolePermissions = cloneDefaults()
  }
  persistRolePermissions(runtimeRolePermissions)
}

function loadRolePermissions(): Record<RoleKey, PermissionKey[]> {
  if (typeof window === 'undefined') return cloneDefaults()
  try {
    const raw = window.localStorage.getItem(ROLE_PERMISSION_STORAGE_KEY)
    if (!raw) return cloneDefaults()
    const parsed = JSON.parse(raw) as Partial<Record<RoleKey, unknown>>
    const base = cloneDefaults()
    ;(Object.keys(base) as RoleKey[]).forEach((role) => {
      const value = parsed?.[role]
      if (!Array.isArray(value)) return
      base[role] = value.filter((item): item is PermissionKey => typeof item === 'string' && item in PERMISSION_DEFINITIONS)
    })
    return base
  } catch {
    return cloneDefaults()
  }
}

function persistRolePermissions(config: Record<RoleKey, PermissionKey[]>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ROLE_PERMISSION_STORAGE_KEY, JSON.stringify(config))
}

function cloneDefaults(): Record<RoleKey, PermissionKey[]> {
  return {
    super_admin: [...DEFAULT_ROLE_PERMISSIONS.super_admin],
    manager: [...DEFAULT_ROLE_PERMISSIONS.manager],
    cashier: [...DEFAULT_ROLE_PERMISSIONS.cashier],
    kitchen: [...DEFAULT_ROLE_PERMISSIONS.kitchen],
    waiter: [...DEFAULT_ROLE_PERMISSIONS.waiter],
    unknown: [...DEFAULT_ROLE_PERMISSIONS.unknown],
  }
}
