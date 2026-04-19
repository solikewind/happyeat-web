// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 获取单个角色 GET /central/v1/iam/roles/${param0} */
export async function iamGetIamRole(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.iamGetIAMRoleParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    role?: { id?: string; role_code?: string; role_name?: string };
  }>(`/central/v1/iam/roles/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
