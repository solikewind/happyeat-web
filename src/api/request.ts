import type { AxiosRequestConfig } from 'axios'
import { api } from './client'

type RequestOptions = AxiosRequestConfig

function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  return api.request<T>({
    url,
    method: options.method ?? 'GET',
    ...options,
  }).then((res) => res.data)
}

export default request
