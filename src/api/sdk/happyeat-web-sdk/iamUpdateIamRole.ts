// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 更新角色展示名（role_code 不可改） PUT /central/v1/iam/roles/${param0} */
export async function iamUpdateIamRole(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.iamUpdateIAMRoleParams,
  body: {
    role_name: string;
  },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/central/v1/iam/roles/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}
