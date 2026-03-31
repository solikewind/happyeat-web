// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 创建菜单种类 POST /central/v1/menu/category */
export async function menucategoryCreateMenuCategory(
  body: {
    description?: string;
    name: string;
  },
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/central/v1/menu/category", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
