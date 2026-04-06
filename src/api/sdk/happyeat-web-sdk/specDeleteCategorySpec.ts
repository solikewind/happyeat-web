// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 删除分类规格模板 DELETE /central/v1/spec/category-spec/${param0} */
export async function specDeleteCategorySpec(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.specDeleteCategorySpecParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Record<string, any>>(
    `/central/v1/spec/category-spec/${param0}`,
    {
      method: "DELETE",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}
