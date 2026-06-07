import type { PermissionKey, RoleKey } from '../auth/permissions'
import { applyRemoteRoleConfig, getRolePermissionConfig, resetRolePermissions, updateRolePermissions } from '../auth/permissions'
import {
  fetchRolePermissions,
  listIAMRoles,
  resetRolePermissions as resetRemoteRolePermissions,
  updateRolePermissions as updateRemoteRolePermissions,
} from './rbac'

export type PermissionStorageMode = 'remote' | 'local'

export interface RolePermissionConfig {
  roles: Record<RoleKey, PermissionKey[]>
  storageMode: PermissionStorageMode
}

function isNotFoundError(error: unknown): boolean {
  const err = error as { response?: { status?: number } }
  return err?.response?.status === 404
}

export async function fetchRolePermissionConfig(): Promise<RolePermissionConfig> {
  try {
    const [matrix, roleList] = await Promise.all([
      fetchRolePermissions(),
      listIAMRoles({ current: 1, pageSize: 200 }),
    ])
    const roles: Record<RoleKey, PermissionKey[]> = {}
    for (const row of matrix) {
      if (row.role) roles[row.role] = (row.permissions ?? []) as PermissionKey[]
    }
    applyRemoteRoleConfig(matrix, roleList.roles)
    return { roles: { ...getRolePermissionConfig(), ...roles }, storageMode: 'remote' }
  } catch (error) {
    if (!isNotFoundError(error)) throw error
    return { roles: getRolePermissionConfig(), storageMode: 'local' }
  }
}

export async function saveRolePermissions(role: RoleKey, permissions: PermissionKey[]): Promise<PermissionStorageMode> {
  try {
    await updateRemoteRolePermissions(role, permissions)
    updateRolePermissions(role, permissions)
    return 'remote'
  } catch (error) {
    if (!isNotFoundError(error)) throw error
    updateRolePermissions(role, permissions)
    return 'local'
  }
}

export async function resetRolePermissionsConfig(role?: RoleKey): Promise<PermissionStorageMode> {
  try {
    await resetRemoteRolePermissions(role)
    await fetchRolePermissionConfig()
    return 'remote'
  } catch (error) {
    if (!isNotFoundError(error)) throw error
    resetRolePermissions(role)
    return 'local'
  }
}
