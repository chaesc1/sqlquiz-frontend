import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthUser {
    email: string
}

interface AuthState {
    accessToken: string | null
    refreshToken: string | null
    user: AuthUser | null
    setTokens: (accessToken: string, refreshToken: string) => void
    setUser: (user: AuthUser | null) => void
    clear: () => void
}

/**
 * 인증 상태 store.
 * localStorage 영속화 — 새로고침해도 로그인 유지.
 * 토큰 라이프사이클은 axios 인터셉터(`shared/lib/api.ts`)가 함께 관리.
 */
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            user: null,
            setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
            setUser: (user) => set({ user }),
            clear: () => set({ accessToken: null, refreshToken: null, user: null }),
        }),
        { name: "sqlquiz.auth" }
    )
)
