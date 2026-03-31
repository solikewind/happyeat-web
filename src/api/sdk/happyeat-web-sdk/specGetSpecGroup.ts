// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 获取规格组 GET /central/v1/spec/group/${param0} */
export async function specGetSpecGroup(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.specGetSpecGroupParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    group?: {
      created_at?: string;
      id?: number;
      name?: string;
      sort?: number;
      updated_at?: string;
    };
  }>(`/central/v1/spec/group/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
