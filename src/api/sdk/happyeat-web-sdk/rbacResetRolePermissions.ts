// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 重置角色权限（可单角色） POST /central/v1/rbac/role-permissions/reset */
export async function rbacResetRolePermissions(
  body: {
    role?: string;
  },
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>(
    "/central/v1/rbac/role-permissions/reset",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}
