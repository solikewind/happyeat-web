// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 创建餐桌 POST /central/v1/tables */
export async function tableCreateTable(
  body: {
    capacity?: number;
    category_id: number;
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
