import { api } from './client'

export interface OpenApiDoc {
  swagger?: string
  info?: {
    title?: string
    version?: string
    description?: string
  }
  paths?: Record<string, unknown>
  definitions?: Record<string, unknown>
  [key: string]: unknown
}

// 通过后端暴露的文件地址获取接口文档 JSON
export async function fetchOpenApiDoc(): Promise<OpenApiDoc> {
  const { data } = await api.get<OpenApiDoc>('/openapi/happyeat.json')
  return data
}