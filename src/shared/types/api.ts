/**
 * 백엔드 ApiResponse<T> 와 1:1 매칭되는 타입.
 * 성공/실패 모두 success 플래그로 구분 — Axios 응답의 .data 가 본 형태.
 */
export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

export interface ErrorBody {
    success: false
    code: string
    message: string
    timestamp: string
}

/** Spring Data Page<T> 응답 형식 (필요한 필드만). */
export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    number: number
    size: number
    first: boolean
    last: boolean
    empty: boolean
}
