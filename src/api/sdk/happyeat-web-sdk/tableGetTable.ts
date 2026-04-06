// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 获取单个餐桌 GET /central/v1/table/${param0} */
export async function tableGetTable(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.tableGetTableParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    table?: {
      capacity?: number;
      category_id?: string;
      code?: string;
      created_at?: string;
      id?: string;
      qr_code?: string;
      status?: string;
      updated_at?: string;
    };
  }>(`/central/v1/table/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
