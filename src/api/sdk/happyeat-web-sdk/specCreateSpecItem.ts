// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 创建规格项 POST /central/v1/spec/item */
export async function specCreateSpecItem(
  body: {
    default_price?: number;
    name: string;
    /** 十进制整数字符串（uint64，避免 JS Number 精度丢失） */
    spec_group_id: string;
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
