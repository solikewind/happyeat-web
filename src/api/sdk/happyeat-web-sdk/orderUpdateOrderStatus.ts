// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 更新订单状态 PUT /central/v1/order/${param0}/status */
export async function orderUpdateOrderStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.orderUpdateOrderStatusParams,
  body: {
    /** paid/preparing/completed/cancelled */
    status: string;
  },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/central/v1/order/${param0}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}
