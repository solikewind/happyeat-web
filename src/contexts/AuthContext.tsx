import { createContext, useCallback, useContext, useState } from 'react'
import { getToken, setToken as saveToken, clearToken, isJwtExpired } from '../api/client'
import { hasPermission, type PermissionKey } from '../auth/permissions'

interface AuthContextValue {
  token: string | null
  isLoggedIn: boolean
  role: string | null
  setToken: (token: string) => void
  logout: () => void
  can: (permission: PermissionKey) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseTokenRole(token: string | null): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded))
    if (payload && typeof payload.role === 'string') return payload.role
    return null
  } catch {
    return null
  }
}

function readInitialSession(): { token: string | null; role: string | null } {
  const t = getToken()
  if (!t) return { token: null, role: null }
  if (isJwtExpired(t)) {
    clearToken()
    return { token: null, role: null }
  }
  return { token: t, role: parseTokenRole(t) }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initial = readInitialSession()
  const [token, setTokenState] = useState<string | null>(initial.token)
  const [role, setRole] = useState<string | null>(initial.role)

  const setToken = useCallback((t: string) => {
    saveToken(t)
    setTokenState(t)
    setRole(parseTokenRole(t))
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
    setRole(null)
  }, [])

  const value: AuthContextValue = {
    token,
    isLoggedIn: !!token,
    role,
    setToken,
    logout,
    can: (permission) => hasPermission(role, permission),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
