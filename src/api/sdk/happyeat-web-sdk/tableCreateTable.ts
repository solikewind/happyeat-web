// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 创建餐桌 POST /central/v1/tables */
export async function tableCreateTable(
  body: {
    capacity?: number;
    /** 十进制整数字符串（uint64，避免 JS Number 精度丢失） */
    category_id: string;
    code: string;
    qr_code?: string;
    status: string;
  },
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/central/v1/tables", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
