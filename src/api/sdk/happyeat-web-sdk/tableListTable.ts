// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 列出餐桌 GET /central/v1/tables */
export async function tableListTable(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.tableListTableParams,
  body: {
    /** 按分类名字筛选 */
    category?: string;
    /** 按分类id筛选 */
    category_id?: string;
    code?: string;
    current?: number;
    pageSize?: number;
    status?: string;
  },
  options?: { [key: string]: any }
) {
  return request<{
    tables?: {
      capacity?: number;
      category_id: string;
      code: string;
      created_at: string;
      id: string;
      qr_code?: string;
      status: string;
      updated_at: string;
    }[];
    total?: number;
  }>("/central/v1/tables", {
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
