import { api } from './client'
import type { PermissionKey, RoleKey } from '../auth/permissions'
import { getRolePermissionConfig, resetRolePermissions, updateRolePermissions } from '../auth/permissions'

export type PermissionStorageMode = 'remote' | 'local'

export interface RolePermissionConfig {
  roles: Record<RoleKey, PermissionKey[]>
  storageMode: PermissionStorageMode
}

interface RemoteRolePermissionResponse {
  roles: Partial<Record<RoleKey, PermissionKey[]>>
}

const REMOTE_BASE = '/central/v1/rbac/role-permissions'

function isNotFoundError(error: unknown): boolean {
  const err = error as { response?: { status?: number } }
  return err?.response?.status === 404
}

export async function fetchRolePermissionConfig(): Promise<RolePermissionConfig> {
  try {
    const { data } = await api.get<RemoteRolePermissionResponse>(REMOTE_BASE)
    const local = getRolePermissionConfig()
    const merged = { ...local, ...(data?.roles ?? {}) }
    return { roles: merged, storageMode: 'remote' }
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error
    }
    return { roles: getRolePermissionConfig(), storageMode: 'local' }
  }
}

export async function saveRolePermissions(role: RoleKey, permissions: PermissionKey[]): Promise<PermissionStorageMode> {
  try {
    await api.put(`${REMOTE_BASE}/${role}`, { permissions })
    return 'remote'
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error
    }
    updateRolePermissions(role, permissions)
    return 'local'
  }
}

export async function resetRolePermissionsConfig(role?: RoleKey): Promise<PermissionStorageMode> {
  try {
    await api.post(`${REMOTE_BASE}/reset`, role ? { role } : {})
    return 'remote'
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error
    }
    resetRolePermissions(role)
    return 'local'
  }
}
