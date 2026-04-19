// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 分页列出权限点（iam_permissions） GET /central/v1/iam/permissions */
export async function iamListIamPermissions(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.iamListIAMPermissionsParams,
  body: {
    current?: number;
    /** 可选：按 code/description 模糊筛 */
    keyword?: string;
    pageSize?: number;
  },
  options?: { [key: string]: any }
) {
  return request<{
    permissions?: { code: string; description: string; id: string }[];
    total?: number;
  }>("/central/v1/iam/permissions", {
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
