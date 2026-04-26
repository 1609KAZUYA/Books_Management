import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { LoginResponse, MeResponse } from '../types/api'
import { getMe } from '../api/auth'
import { tokenStore } from '../api/tokenStore'

interface AuthContextType {
  user: MeResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (response: LoginResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = tokenStore.get()
    if (!token) {
      setIsLoading(false)
      return
    }
    getMe()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setIsLoading(false))
  }, [])

  const login = (response: LoginResponse) => {
    tokenStore.set(response.accessToken)
    setUser(response.user)
  }

  const logout = () => {
    tokenStore.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
