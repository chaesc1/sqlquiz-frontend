import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/features/auth/store"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10_000,
})

// ───────── Request: 토큰 자동 주입 ─────────
api.interceptors.request.use((config) => {
    const at = useAuthStore.getState().accessToken
    if (at) config.headers.Authorization = `Bearer ${at}`
    return config
})

// ───────── Response: 401 → reissue 1회 시도 ─────────
// 동시 401 처리: refresh 진행 중이면 그 promise 를 기다림 (중복 reissue 방지)
let refreshingPromise: Promise<string | null> | null = null

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = error.config as RetryConfig | undefined
        if (
            !original ||
            error.response?.status !== 401 ||
            original._retry ||
            original.url?.includes("/auth/")    // login/reissue 자체는 retry 안 함
        ) {
            return Promise.reject(error)
        }
        original._retry = true

        const { refreshToken, setTokens, clear } = useAuthStore.getState()
        if (!refreshToken) {
            clear()
            window.location.assign("/login")
            return Promise.reject(error)
        }

        if (!refreshingPromise) {
            refreshingPromise = api
                .post("/api/v1/auth/reissue", { refreshToken })
                .then((res) => {
                    const { accessToken, refreshToken: newRT } = res.data.data
                    setTokens(accessToken, newRT)
                    return accessToken as string
                })
                .catch(() => {
                    clear()
                    window.location.assign("/login")
                    return null
                })
                .finally(() => {
                    refreshingPromise = null
                })
        }

        const newAT = await refreshingPromise
        if (!newAT) return Promise.reject(error)
        original.headers.Authorization = `Bearer ${newAT}`
        return api(original)
    }
)
