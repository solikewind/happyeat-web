// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 创建分类规格模板 POST /central/v1/spec/category-spec */
export async function specCreateCategorySpec(
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
  return request<Record<string, any>>("/central/v1/spec/category-spec", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
