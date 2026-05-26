/**
 * Exam 도메인 타입.
 * 백엔드 ExamStartRequest / ExamSessionResponse / ExamSubmitRequest / ExamResultResponse 와 1:1.
 *
 * 핵심 설계 결정 (백엔드와 일치):
 *  - 진행 중 응답(QuestionInExam) 에는 정답/해설이 절대 포함되지 않는다.
 *  - 시작 시점에 N개의 AttemptAnswer 가 사전 생성 → questions 는 항상 totalCount 와 동일 길이.
 *  - selectedOption=null 은 "미선택" 의미. 백엔드가 자동 오답 처리.
 */

import type { Difficulty, ExamType } from "@/features/questions/types"

export type AttemptStatus = "IN_PROGRESS" | "COMPLETED"

export interface ExamStartRequest {
    examType: ExamType
    count: number           // 1~50
    difficulty?: Difficulty
}

export interface QuestionInExam {
    questionId: number
    content: string
    option1: string
    option2: string
    option3: string
    option4: string
    difficulty: Difficulty
    categoryName: string
    /** 이전에 고른 답(이어풀기). 1~4 또는 null. */
    selectedOption: number | null
}

export interface ExamSessionResponse {
    attemptId: string       // UUID
    examType: ExamType
    status: AttemptStatus
    totalCount: number
    startedAt: string       // ISO LocalDateTime
    questions: QuestionInExam[]
}

export interface AnswerSubmission {
    questionId: number
    /** 1~4 또는 null (미선택). */
    selectedOption: number | null
}

export interface ExamSubmitRequest {
    answers: AnswerSubmission[]
}

export interface CategoryScore {
    categoryName: string
    total: number
    correct: number
}

export interface ExamResultResponse {
    attemptId: string
    examType: ExamType
    correctCount: number
    totalCount: number
    score: number           // 0~100
    completedAt: string
    categoryStats: CategoryScore[]
}
