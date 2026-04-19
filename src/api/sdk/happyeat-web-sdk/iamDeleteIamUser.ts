// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 删除用户（软删，并清除 Casbin 中该用户全部分组） DELETE /central/v1/iam/users/${param0} */
export async function iamDeleteIamUser(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.iamDeleteIAMUserParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/central/v1/iam/users/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}
