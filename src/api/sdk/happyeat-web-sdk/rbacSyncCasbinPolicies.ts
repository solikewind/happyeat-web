// @ts-ignore
/* eslint-disable */
import request from "../../request";

/** 将 IAM 同步到 Casbin（刷新 casbin_rule，供管理端按钮触发） POST /central/v1/rbac/casbin/sync */
export async function rbacSyncCasbinPolicies(options?: { [key: string]: any }) {
  return request<Record<string, any>>("/central/v1/rbac/casbin/sync", {
    method: "POST",
    ...(options || {}),
  });
}
