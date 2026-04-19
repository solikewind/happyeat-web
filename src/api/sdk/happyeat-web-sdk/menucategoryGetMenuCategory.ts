// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 获取菜单种类 GET /central/v1/menu/category/${param0} */
export async function menucategoryGetMenuCategory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.menucategoryGetMenuCategoryParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    category?: {
      created_at?: string;
      description?: string;
      id?: string;
      name?: string;
      sort?: number;
      updated_at?: string;
    };
  }>(`/central/v1/menu/category/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
