// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 更新餐桌 PUT /central/v1/table/${param0} */
export async function tableUpdateTable(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.tableUpdateTableParams,
  body: {
    capacity?: number;
    category_id: string;
    code: string;
    qr_code?: string;
    status: string;
  },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/central/v1/table/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}
