// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 列出菜单种类 GET /central/v1/menu/categories */
export async function menucategoryListMenuCategory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.menucategoryListMenuCategoryParams,
  body: {
    current?: number;
    name?: string;
    pageSize?: number;
  },
  options?: { [key: string]: any }
) {
  return request<{
    categories?: {
      created_at: string;
      description?: string;
      id: string;
      name: string;
      sort?: number;
      updated_at: string;
    }[];
    total?: number;
  }>("/central/v1/menu/categories", {
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
