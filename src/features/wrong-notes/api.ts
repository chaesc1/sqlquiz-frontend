import { api } from "@/shared/lib/api"
import type { ApiResponse, PageResponse } from "@/shared/types/api"
import type {
    WrongNote,
    WrongNoteCreateRequest,
    WrongNoteMemoUpdateRequest,
} from "./types"

export interface WrongNoteListParams {
    categoryId?: number
    isResolved?: boolean
    page?: number
    size?: number
    sort?: string          // 기본 createdAt,desc
}

export const wrongNoteApi = {
    list: (params: WrongNoteListParams) =>
        api.get<ApiResponse<PageResponse<WrongNote>>>("/api/v1/wrong-notes", { params }),

    create: (body: WrongNoteCreateRequest) =>
        api.post<ApiResponse<number>>("/api/v1/wrong-notes", body),

    updateMemo: (id: number, body: WrongNoteMemoUpdateRequest) =>
        api.patch<ApiResponse<null>>(`/api/v1/wrong-notes/${id}/memo`, body),

    resolve: (id: number) =>
        api.patch<ApiResponse<null>>(`/api/v1/wrong-notes/${id}/resolve`),

    remove: (id: number) =>
        api.delete<ApiResponse<null>>(`/api/v1/wrong-notes/${id}`),
}
