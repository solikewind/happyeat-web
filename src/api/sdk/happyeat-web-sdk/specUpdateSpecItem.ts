// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 更新规格项 PUT /central/v1/spec/item/${param0} */
export async function specUpdateSpecItem(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.specUpdateSpecItemParams,
  body: {
    default_price?: number;
    name: string;
    /** 十进制整数字符串（uint64，避免 JS Number 精度丢失） */
    spec_group_id: string;
  },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/central/v1/spec/item/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}
