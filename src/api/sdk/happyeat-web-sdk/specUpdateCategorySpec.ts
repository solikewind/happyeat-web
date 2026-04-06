// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 更新分类规格模板 PUT /central/v1/spec/category-spec/${param0} */
export async function specUpdateCategorySpec(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.specUpdateCategorySpecParams,
  body: {
    /** 十进制整数字符串（uint64，避免 JS Number 精度丢失） */
    category_id: string;
    price_delta?: number;
    sort?: number;
    spec_type: string;
    spec_value: string;
  },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(
    `/central/v1/spec/category-spec/${param0}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}
