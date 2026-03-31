// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 更新餐桌类别 PUT /central/v1/table/category/${param0} */
export async function tablecategoryUpdateTableCategory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.tablecategoryUpdateTableCategoryParams,
  body: {
    category: { description?: string; name: string };
  },
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/central/v1/table/category/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}
