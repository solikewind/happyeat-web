// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 删除角色（软删；系统预置角色不可删；删除后全量同步 Casbin） DELETE /central/v1/iam/roles/${param0} */
export async function iamDeleteIamRole(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.iamDeleteIAMRoleParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/central/v1/iam/roles/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}
