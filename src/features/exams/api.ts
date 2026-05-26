import { api } from "@/shared/lib/api"
import type { ApiResponse } from "@/shared/types/api"
import type {
    ExamResultResponse,
    ExamSessionResponse,
    ExamStartRequest,
    ExamSubmitRequest,
} from "./types"

export const examApi = {
    start: (body: ExamStartRequest) =>
        api.post<ApiResponse<ExamSessionResponse>>("/api/v1/exams", body),

    get: (id: string) =>
        api.get<ApiResponse<ExamSessionResponse>>(`/api/v1/exams/${id}`),

    submit: (id: string, body: ExamSubmitRequest) =>
        api.post<ApiResponse<ExamResultResponse>>(`/api/v1/exams/${id}/submit`, body),

    result: (id: string) =>
        api.get<ApiResponse<ExamResultResponse>>(`/api/v1/exams/${id}/result`),
}
