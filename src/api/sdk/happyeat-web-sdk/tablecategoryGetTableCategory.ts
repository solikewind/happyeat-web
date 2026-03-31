// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 获取餐桌类别 GET /central/v1/table/category/${param0} */
export async function tablecategoryGetTableCategory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.tablecategoryGetTableCategoryParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<{
    category?: { description?: string; id?: number; name?: string };
  }>(`/central/v1/table/category/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}
