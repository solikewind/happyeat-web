// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 列出菜单 GET /central/v1/menus */
export async function menuListMenu(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.menuListMenuParams,
  body: {
    /** 按分类名字筛选 */
    category?: string;
    /** 按分类id筛选 */
    category_id?: string;
    current?: number;
    name?: string;
    pageSize?: number;
  },
  options?: { [key: string]: any }
) {
  return request<{
    menus?: {
      category_id: string;
      created_at: string;
      description?: string;
      id: string;
      image?: string;
      name: string;
      price: number;
      specs?: {
        category_spec_id?: string;
        price_delta: number;
        sort?: number;
        source?: string;
        spec_item_id?: string;
        spec_type?: string;
        spec_value?: string;
      }[];
      updated_at: string;
    }[];
    total?: number;
  }>("/central/v1/menus", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      ...params,
    },
    data: body,
    ...(options || {}),
  });
}
