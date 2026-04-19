// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 更新菜单 PUT /central/v1/menu/${param0} */
export async function menuUpdateMenu(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.menuUpdateMenuParams,
  body: {
    category_id?: string;
    description?: string;
    image?: string;
    name: string;
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
  },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/central/v1/menu/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}
