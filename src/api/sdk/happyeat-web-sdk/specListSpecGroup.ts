// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 列出规格组 GET /central/v1/spec/groups */
export async function specListSpecGroup(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.specListSpecGroupParams,
  body: {
    current?: number;
    name?: string;
    pageSize?: number;
  },
  options?: { [key: string]: any }
) {
  return request<{
    groups?: {
      created_at: string;
      id: string;
      name: string;
      sort?: number;
      updated_at: string;
    }[];
    total?: number;
  }>("/central/v1/spec/groups", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      ...params,
    },
    data: body,
    ...(options || {}),
  });
}
