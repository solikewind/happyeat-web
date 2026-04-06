// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 登录获取 JWT，用于 Swagger Authorize 或前端 POST /central/v1/auth/login */
export async function authLogin(
  body: {
    password: string;
    username: string;
  },
  options?: { [key: string]: any }
) {
  return request<{ access_token?: string; expire?: number }>(
    "/central/v1/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}
