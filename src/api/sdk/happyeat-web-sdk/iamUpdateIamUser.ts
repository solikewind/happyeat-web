// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 更新用户展示名 PUT /central/v1/iam/users/${param0} */
export async function iamUpdateIamUser(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.iamUpdateIAMUserParams,
  body: {
    display_name: string;
  },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/central/v1/iam/users/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}
