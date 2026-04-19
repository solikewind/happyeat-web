/**
 * 生成带 Vite `BASE_URL` 的应用内路径，用于 `<a href>`（如新标签打开大屏）。
 */
export function appPath(to: string): string {
  const path = to.startsWith('/') ? to : `/${to}`
  const raw = import.meta.env.BASE_URL || '/'
  const base = raw.replace(/\/+$/, '')
  if (!base) return path
  return `${base}${path}`
}
