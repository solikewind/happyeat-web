// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 获取单个角色的权限列表 GET /central/v1/rbac/role-permissions/${param0} */
export async function rbacGetRolePermission(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.rbacGetRolePermissionParams,
  options?: { [key: string]: any }
) {
  const { role: param0, ...queryParams } = params;
  return request<{
    role_permission?: { permissions?: string[]; role?: string };
  }>(`/central/v1/rbac/role-permissions/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
