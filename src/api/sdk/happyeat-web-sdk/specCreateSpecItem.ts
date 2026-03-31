// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 创建规格项 POST /central/v1/spec/item */
export async function specCreateSpecItem(
  body: {
    default_price?: number;
    name: string;
    spec_group_id: number;
  },
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/central/v1/spec/item", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
