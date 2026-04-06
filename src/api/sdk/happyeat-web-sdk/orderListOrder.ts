// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 列出订单 GET /central/v1/orders */
export async function orderListOrder(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.orderListOrderParams,
  body: {
    current?: number;
    /** dine_in | takeaway */
    order_type?: string;
    pageSize?: number;
    status?: string;
    /** 按餐桌筛选 */
    table_id?: string;
  },
  options?: { [key: string]: any }
) {
  return request<{
    orders?: {
      created_at: string;
      id: string;
      items?: {
        amount: number;
        menu_name: string;
        quantity: number;
        spec_info?: string;
        unit_price: number;
      }[];
      order_no: string;
      order_type: string;
      remark?: string;
      status: string;
      table_category?: string;
      table_code?: string;
      table_id?: string;
      total_amount: number;
      updated_at: string;
    }[];
    total?: number;
  }>("/central/v1/orders", {
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
