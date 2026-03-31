// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 列出餐桌类别 GET /central/v1/table/categories */
export async function tablecategoryListTableCategory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.tablecategoryListTableCategoryParams,
  body: {
    current?: number;
    name?: string;
    pageSize?: number;
  },
  options?: { [key: string]: any }
) {
  return request<{
    categories?: { description?: string; id: number; name: string }[];
    total?: number;
  }>("/central/v1/table/categories", {
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
