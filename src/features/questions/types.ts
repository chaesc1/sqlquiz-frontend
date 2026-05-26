/**
 * Question 도메인 타입.
 * 백엔드의 QuestionResponse / QuestionDetailResponse / CategoryResponse 와 1:1.
 */

export type ExamType = "SQLD" | "SQLP"
export type Difficulty = "EASY" | "MEDIUM" | "HARD"

export interface Category {
    id: number
    name: string
    examType: ExamType
}

/** 목록 응답 — answer/explanation 의도적으로 제외. */
export interface Question {
    id: number
    content: string
    option1: string
    option2: string
    option3: string
    option4: string
    difficulty: Difficulty
    categoryId: number
    categoryName: string
    examType: ExamType
}

/** 상세 응답 — 정답/해설 포함. */
export interface QuestionDetail extends Question {
    answer: number          // 1~4
    explanation: string | null
}
