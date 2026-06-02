import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Role = "ROLE_USER" | "ROLE_ADMIN"

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

// ───────────────────────────────────────────────────────────────────────────
// JWT 디코드 (클라이언트 — 서명 검증 없음, role 표시용만)
//
// 보안 노트: 권한 검증은 백엔드가 책임진다(SecurityConfig + @PreAuthorize).
// 클라이언트의 role 정보는 UI 라우팅/표시 분기용일 뿐, 신뢰 경계가 아니다.
// 토큰을 조작해 isAdmin=true 로 만들어도 ADMIN API 호출은 백엔드가 차단함.
// ───────────────────────────────────────────────────────────────────────────

interface JwtPayload {
    sub?: string
    role?: Role
    exp?: number
    iat?: number
}

function decodeJwt(token: string): JwtPayload | null {
    try {
        const part = token.split(".")[1]
        if (!part) return null
        // base64url → base64
        const b64 = part.replace(/-/g, "+").replace(/_/g, "/")
        const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4))
        const json = atob(b64 + pad)
        // atob 결과는 latin-1 — UTF-8 한글 등이 있으면 보정 필요 (role 만 보면 ASCII 라 보통 OK)
        const decoded = decodeURIComponent(escape(json))
        return JSON.parse(decoded) as JwtPayload
    } catch {
        return null
    }
}

/** 현재 AT 의 role 클레임을 반환. 없거나 만료/파싱 실패면 null. */
export function useRole(): Role | null {
    const at = useAuthStore((s) => s.accessToken)
    if (!at) return null
    const payload = decodeJwt(at)
    if (!payload) return null
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload.role ?? null
}

/** ROLE_ADMIN 여부. UI 라우팅/표시 분기 전용 — 권한 검증은 백엔드. */
export function useIsAdmin(): boolean {
    return useRole() === "ROLE_ADMIN"
}
