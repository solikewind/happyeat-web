// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 获取单个权限点 GET /central/v1/iam/permissions/${param0} */
export async function iamGetIamPermission(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.iamGetIAMPermissionParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    permission?: { code?: string; description?: string; id?: string };
  }>(`/central/v1/iam/permissions/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
