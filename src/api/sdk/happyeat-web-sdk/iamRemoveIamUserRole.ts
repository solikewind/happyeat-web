// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 移除用户的某个角色；使用 query：?user_code=&role_code= DELETE /central/v1/iam/user-roles */
export async function iamRemoveIamUserRole(
  body: {
    user_code?: string;
    role_code?: string;
  },
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/central/v1/iam/user-roles", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: body,
    ...(options || {}),
  });
}
