// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 创建餐桌类别 POST /central/v1/table/category */
export async function tablecategoryCreateTableCategory(
  body: {
    description?: string;
    name: string;
  },
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/central/v1/table/category", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
