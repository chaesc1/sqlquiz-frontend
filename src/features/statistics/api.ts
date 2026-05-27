import { api } from "@/shared/lib/api"
import type { ApiResponse, PageResponse } from "@/shared/types/api"
import type { CategoryStat, HistoryItem, StatSummary } from "./types"

export interface HistoryParams {
    page?: number
    size?: number
    sort?: string          // 기본 startedAt,desc
}

export const statisticsApi = {
    summary: () =>
        api.get<ApiResponse<StatSummary>>("/api/v1/statistics/summary"),

    categories: () =>
        api.get<ApiResponse<CategoryStat[]>>("/api/v1/statistics/categories"),

    weakPoints: (limit = 5) =>
        api.get<ApiResponse<CategoryStat[]>>("/api/v1/statistics/weak-points", {
            params: { limit },
        }),

    history: (params: HistoryParams = {}) =>
        api.get<ApiResponse<PageResponse<HistoryItem>>>("/api/v1/statistics/history", {
            params,
        }),
}
