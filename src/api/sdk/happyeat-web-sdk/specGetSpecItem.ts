// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 获取规格项 GET /central/v1/spec/item/${param0} */
export async function specGetSpecItem(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.specGetSpecItemParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    item?: {
      created_at?: string;
      default_price?: number;
      id?: number;
      name?: string;
      spec_group_id?: number;
      updated_at?: string;
    };
  }>(`/central/v1/spec/item/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
