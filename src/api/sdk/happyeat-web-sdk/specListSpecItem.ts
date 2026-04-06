// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 列出规格项 GET /central/v1/spec/items */
export async function specListSpecItem(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.specListSpecItemParams,
  body: {
    current?: number;
    name?: string;
    pageSize?: number;
    /** 十进制整数字符串（uint64，避免 JS Number 精度丢失） */
    spec_group_id?: string;
  },
  options?: { [key: string]: any }
) {
  return request<{
    items?: {
      created_at: string;
      default_price: number;
      id: string;
      name: string;
      spec_group_id: string;
      updated_at: string;
    }[];
    total?: number;
  }>("/central/v1/spec/items", {
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
