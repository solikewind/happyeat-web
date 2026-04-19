// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 创建角色（无权限点，需再通过 RBAC 矩阵配置） POST /central/v1/iam/roles */
export async function iamCreateIamRole(
  body: {
    role_code: string;
    role_name?: string;
  },
  options?: { [key: string]: any }
) {
  return request<{ id?: string }>("/central/v1/iam/roles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
