// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 获取角色权限矩阵 GET /central/v1/rbac/role-permissions */
export async function rbacListRolePermission(options?: { [key: string]: any }) {
  return request<{ roles?: { permissions: string[]; role: string }[] }>(
    "/central/v1/rbac/role-permissions",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}
