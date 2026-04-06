// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 获取单个订单 GET /central/v1/order/${param0} */
export async function orderGetOrder(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.orderGetOrderParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    order?: {
      created_at?: string;
      id?: string;
      items?: {
        amount: number;
        menu_name: string;
        quantity: number;
        spec_info?: string;
        unit_price: number;
      }[];
      order_no?: string;
      order_type?: string;
      remark?: string;
      status?: string;
      table_category?: string;
      table_code?: string;
      table_id?: string;
      total_amount?: number;
      updated_at?: string;
    };
  }>(`/central/v1/order/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
