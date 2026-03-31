// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 创建规格组 POST /central/v1/spec/group */
export async function specCreateSpecGroup(
  body: {
    name: string;
    sort?: number;
  },
  options?: { [key: string]: any }
) {
  return request<Record<string, any>>("/central/v1/spec/group", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
