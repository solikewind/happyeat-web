// @ts-ignore
/* eslint-disable */
import request from "./src/api/request";

/** 删除菜单 DELETE /central/v1/menu/${param0} */
export async function menuDeleteMenu(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.menuDeleteMenuParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(`/central/v1/menu/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}
