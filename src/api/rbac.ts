import { api } from './client'

export interface PermissionEndpoint {
  obj: string
  act: string
}

export interface PermissionCatalogItem {
  code: string
  description: string
  endpoints: PermissionEndpoint[]
}

export interface RolePermissionRow {
  role: string
  permissions: string[]
}

export interface IAMRoleRow {
  id: string
  role_code: string
  role_name: string
}

const RBAC_BASE = '/central/v1/rbac'
const IAM_BASE = '/central/v1/iam'

export const PRESET_ROLE_CODES = new Set(['super_admin', 'manager', 'cashier', 'kitchen', 'waiter'])

export async function fetchPermissionCatalog(): Promise<PermissionCatalogItem[]> {
  const { data } = await api.get<{ permissions?: PermissionCatalogItem[] }>(`${RBAC_BASE}/permission-catalog`)
  return Array.isArray(data?.permissions) ? data.permissions : []
}

export async function fetchRolePermissions(): Promise<RolePermissionRow[]> {
  const { data } = await api.get<{ roles?: RolePermissionRow[] }>(`${RBAC_BASE}/role-permissions`)
  return Array.isArray(data?.roles) ? data.roles : []
}

export async function updateRolePermissions(role: string, permissions: string[]) {
  await api.put(`${RBAC_BASE}/role-permissions/${encodeURIComponent(role)}`, { permissions })
}

export async function resetRolePermissions(role?: string) {
  await api.post(`${RBAC_BASE}/role-permissions/reset`, role ? { role } : {})
}

export async function syncCasbinPolicies() {
  await api.post(`${RBAC_BASE}/casbin/sync`, {})
}

export async function listIAMRoles(params?: { current?: number; pageSize?: number; keyword?: string }) {
  const { data } = await api.get<{ roles?: IAMRoleRow[]; total?: number }>(`${IAM_BASE}/roles`, { params })
  return {
    roles: Array.isArray(data?.roles) ? data.roles : [],
    total: Number(data?.total) || 0,
  }
}

export async function createIAMRole(body: {
  role_code: string
  role_name?: string
  permissions?: string[]
}) {
  const { data } = await api.post<{ id?: string }>(`${IAM_BASE}/roles`, body)
  return data
}

export async function deleteIAMRole(id: string) {
  await api.delete(`${IAM_BASE}/roles/${id}`)
}
