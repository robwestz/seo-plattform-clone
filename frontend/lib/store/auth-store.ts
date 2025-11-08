import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  tenantId: string | null
  setUser: (user: User | null) => void
  setTenantId: (tenantId: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      tenantId: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setTenantId: (tenantId) =>
        set({
          tenantId,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          tenantId: null,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
