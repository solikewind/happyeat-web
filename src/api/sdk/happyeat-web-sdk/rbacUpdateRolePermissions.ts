// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 更新角色权限（全量覆盖） PUT /central/v1/rbac/role-permissions/${param0} */
export async function rbacUpdateRolePermissions(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.rbacUpdateRolePermissionsParams,
  body: {
    permissions: string[];
  },
  options?: { [key: string]: any }
) {
  const { role: param0, ...queryParams } = params;
  return request<Record<string, any>>(
    `/central/v1/rbac/role-permissions/${param0}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}
