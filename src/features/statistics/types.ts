/**
 * Statistics 도메인 타입.
 * 백엔드 SummaryResponse / CategoryStatResponse / HistoryItemResponse 와 1:1.
 *
 * 주의: 백엔드 SummaryResponse.overallAccuracy() 는 record 의 component 가 아니라
 * 메서드라서 JSON 으로 직렬화되지 않는다 (실제 응답 확인 완료).
 * → 전체 정답률은 프론트에서 totalCorrect / totalQuestions 로 계산한다.
 */

import type { ExamType } from "@/features/questions/types"

export type AttemptStatus = "IN_PROGRESS" | "COMPLETED"

export interface StatSummary {
    totalAttempts: number
    completedAttempts: number
    averageScore: number       // 0~100 (완료 시험 평균)
    totalQuestions: number
    totalCorrect: number
}

export interface CategoryStat {
    categoryId: number
    categoryName: string
    examType: ExamType
    totalAttempted: number
    totalCorrect: number
    accuracy: number           // 0~100
}

export interface HistoryItem {
    attemptId: string
    examType: ExamType
    status: AttemptStatus
    totalCount: number
    correctCount: number | null   // IN_PROGRESS 면 의미 없음
    score: number | null          // 0~100, IN_PROGRESS 면 의미 없음
    startedAt: string
    completedAt: string | null
}

/** 전체 정답률(0~100). 분모 0이면 0. */
export function overallAccuracy(s: StatSummary): number {
    return s.totalQuestions === 0 ? 0 : (s.totalCorrect / s.totalQuestions) * 100
}
