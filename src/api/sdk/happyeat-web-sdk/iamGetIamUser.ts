// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 获取单个用户及角色列表 GET /central/v1/iam/users/${param0} */
export async function iamGetIamUser(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.iamGetIAMUserParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    user?: {
      display_name?: string;
      id?: string;
      roles?: string[];
      user_code?: string;
    };
  }>(`/central/v1/iam/users/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
