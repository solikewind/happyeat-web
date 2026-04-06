// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 工作台订单列表（默认待处理：created/paid/preparing）；出单用 更新订单状态 置为 completed GET /central/v1/workbench/orders */
export async function workbenchListWorkbenchOrder(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.workbenchListWorkbenchOrderParams,
  body: {
    current?: number;
    pageSize?: number;
    /** 不传则默认查 created,paid,preparing */
    status?: string;
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
  }>("/central/v1/workbench/orders", {
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
