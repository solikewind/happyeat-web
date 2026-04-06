import axios, { type AxiosInstance } from 'axios'

const baseURL = '/api'

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

const TOKEN_KEY = 'happyeat_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** 解析 JWT payload 中的 exp；无 exp 或解析失败则视为未声明过期（不当作已过期）。 */
export function isJwtExpired(token: string): boolean {
  const parts = token.split('.')
  if (parts.length < 2) return true
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as { exp?: number }
    if (typeof payload.exp !== 'number') return false
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    if (isJwtExpired(token)) {
      clearToken()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
      return Promise.reject(new Error('JWT expired'))
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 约定：令牌过期、未登录、签名无效等应返回 401，前端据此清会话并回登录页。
    // 若后端对过期 Token 返回 403，浏览器无法可靠区分「过期」与「有权登录但无权访问资源」，请在后端改为 401。
    if (err.response?.status === 401) {
      clearToken()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)
