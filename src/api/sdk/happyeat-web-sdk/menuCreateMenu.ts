// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 创建菜单 POST /central/v1/menus */
export async function menuCreateMenu(
  body: {
    category_id: number;
    description?: string;
    image?: string;
    name: string;
    /** 以分为单位，避免前端浮点数问题，展示/100 */
    price: number;
    specs?: {
      category_spec_id?: number;
      price_delta: number;
      sort: number;
      spec_item_id?: number;
    }[];
  },
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/central/v1/menus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
