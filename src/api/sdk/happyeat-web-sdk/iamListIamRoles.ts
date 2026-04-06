// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 分页列出角色（iam_roles） GET /central/v1/iam/roles */
export async function iamListIamRoles(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.iamListIAMRolesParams,
  body: {
    current?: number;
    keyword?: string;
    pageSize?: number;
  },
  options?: { [key: string]: any }
) {
  return request<{
    roles?: { role_code: string; role_name: string }[];
    total?: number;
  }>("/central/v1/iam/roles", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      ...params,
    },
    data: body,
    ...(options || {}),
  });
}
