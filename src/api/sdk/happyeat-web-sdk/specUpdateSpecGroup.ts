// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 更新规格组 PUT /central/v1/spec/group/${param0} */
export async function specUpdateSpecGroup(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.specUpdateSpecGroupParams,
  body: {
    name: string;
    sort?: number;
  },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/central/v1/spec/group/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}
