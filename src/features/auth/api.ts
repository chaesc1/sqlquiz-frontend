import { api } from "@/shared/lib/api"
import type { ApiResponse } from "@/shared/types/api"

export interface TokenResponse {
    tokenType: string
    accessToken: string
    refreshToken: string
}

export interface SignupBody {
    email: string
    password: string
    nickname: string
}

export interface LoginBody {
    email: string
    password: string
}

export const authApi = {
    signup: (body: SignupBody) =>
        api.post<ApiResponse<null>>("/api/v1/auth/signup", body),
    login: (body: LoginBody) =>
        api.post<ApiResponse<TokenResponse>>("/api/v1/auth/login", body),
    logout: () =>
        api.post<ApiResponse<null>>("/api/v1/auth/logout"),
}
