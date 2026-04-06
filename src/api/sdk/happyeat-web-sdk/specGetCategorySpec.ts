// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 获取分类规格模板 GET /central/v1/spec/category-spec/${param0} */
export async function specGetCategorySpec(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.specGetCategorySpecParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    spec?: {
      category_id?: string;
      created_at?: string;
      id?: string;
      price_delta?: number;
      sort?: number;
      spec_type?: string;
      spec_value?: string;
      updated_at?: string;
    };
  }>(`/central/v1/spec/category-spec/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
