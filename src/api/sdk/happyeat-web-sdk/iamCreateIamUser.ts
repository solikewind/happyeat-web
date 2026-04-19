// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 创建用户（仅主体档案，分配角色用 user-roles 接口） POST /central/v1/iam/users */
export async function iamCreateIamUser(
  body: {
    display_name?: string;
    user_code: string;
  },
  options?: { [key: string]: any }
) {
  return request<{ id?: string }>("/central/v1/iam/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
