// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 创建订单 POST /central/v1/orders */
export async function orderCreateOrder(
  body: {
    items: {
      menu_name: string;
      quantity: number;
      spec_info?: string;
      unit_price: number;
    }[];
    /** dine_in | takeaway */
    order_type: string;
    remark?: string;
    /** 堂食必填 */
    table_id?: number;
    total_amount: number;
  },
  options?: { [key: string]: any }
) {
  return request<{
    order?: {
      created_at?: string;
      id?: number;
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
      table_id?: number;
      total_amount?: number;
      updated_at?: string;
    };
  }>("/central/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
