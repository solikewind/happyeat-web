// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 分页列出用户及其角色 GET /central/v1/iam/users */
export async function iamListIamUsers(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.iamListIAMUsersParams,
  body: {
    current?: number;
    /** 可选：user_code / display_name */
    keyword?: string;
    pageSize?: number;
  },
  options?: { [key: string]: any }
) {
  return request<{
    total?: number;
    users?: { display_name: string; roles: string[]; user_code: string }[];
  }>("/central/v1/iam/users", {
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
