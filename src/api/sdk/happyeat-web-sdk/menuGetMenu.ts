// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 获取单个菜单 GET /central/v1/menu/${param0} */
export async function menuGetMenu(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.menuGetMenuParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    menu?: {
      category_id?: string;
      created_at?: string;
      description?: string;
      id?: string;
      image?: string;
      name?: string;
      price?: number;
      specs?: {
        category_spec_id?: string;
        price_delta: number;
        sort?: number;
        source?: string;
        spec_item_id?: string;
        spec_type?: string;
        spec_value?: string;
      }[];
      updated_at?: string;
    };
  }>(`/central/v1/menu/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
