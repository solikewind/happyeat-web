// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 列出分类规格模板 GET /central/v1/spec/category-spec */
export async function specListCategorySpec(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.specListCategorySpecParams,
  body: {
    category_id?: number;
    current?: number;
    pageSize?: number;
    spec_type?: string;
  },
  options?: { [key: string]: any }
) {
  return request<{
    specs?: {
      category_id: number;
      created_at: string;
      id: number;
      price_delta: number;
      sort: number;
      spec_type: string;
      spec_value: string;
      updated_at: string;
    }[];
    total?: number;
  }>("/central/v1/spec/category-spec", {
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
