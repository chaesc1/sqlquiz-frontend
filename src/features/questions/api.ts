import { api } from "@/shared/lib/api"
import type { ApiResponse, PageResponse } from "@/shared/types/api"
import type { Category, Difficulty, ExamType, Question, QuestionDetail } from "./types"

export interface QuestionSearchParams {
    examType?: ExamType
    categoryId?: number
    difficulty?: Difficulty
    page?: number
    size?: number
    sort?: string         // 예: "id,asc"
}

/** 백엔드 QuestionCreateRequest / QuestionUpdateRequest (동일 구조). */
export interface QuestionWriteRequest {
    categoryId: number
    content: string
    option1: string
    option2: string
    option3: string
    option4: string
    answer: number        // 1~4
    explanation: string | null
    difficulty: Difficulty
}

export const categoryApi = {
    list: (examType?: ExamType) =>
        api.get<ApiResponse<Category[]>>("/api/v1/categories", {
            params: examType ? { examType } : undefined,
        }),
}

export const questionApi = {
    search: (params: QuestionSearchParams) =>
        api.get<ApiResponse<PageResponse<Question>>>("/api/v1/questions", {
            // axios 의 params 가 undefined 값을 자동으로 제거 → 빈 필터를 그대로 보내도 안전
            params,
        }),
    detail: (id: number) =>
        api.get<ApiResponse<QuestionDetail>>(`/api/v1/questions/${id}`),

    // ── ADMIN 전용 (백엔드 @PreAuthorize("hasRole('ADMIN')")) ──
    create: (body: QuestionWriteRequest) =>
        api.post<ApiResponse<number>>("/api/v1/questions", body),
    update: (id: number, body: QuestionWriteRequest) =>
        api.put<ApiResponse<null>>(`/api/v1/questions/${id}`, body),
    remove: (id: number) =>
        api.delete<ApiResponse<null>>(`/api/v1/questions/${id}`),
}
