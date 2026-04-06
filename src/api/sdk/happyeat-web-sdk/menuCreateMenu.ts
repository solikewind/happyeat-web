// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 创建菜单 POST /central/v1/menus */
export async function menuCreateMenu(
  body: {
    /** 十进制整数字符串（uint64，避免 JS Number 精度丢失） */
    category_id: string;
    description?: string;
    image?: string;
    name: string;
    /** 以分为单位，避免前端浮点数问题，展示/100 */
    price: number;
    specs?: {
      category_spec_id?: string;
      price_delta: number;
      sort: number;
      spec_item_id?: string;
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
