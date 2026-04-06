// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 为用户绑定角色（幂等：已绑定则成功）；path 固定便于 Casbin obj 精确匹配 POST /central/v1/iam/user-roles */
export async function iamAssignIamUserRole(
  body: {
    role_code: string;
    user_code: string;
  },
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/central/v1/iam/user-roles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
