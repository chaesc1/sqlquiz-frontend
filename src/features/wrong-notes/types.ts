/**
 * WrongNote 도메인 타입.
 * 백엔드 WrongNoteResponse / WrongNoteCreateRequest / WrongNoteMemoUpdateRequest 와 1:1.
 *
 * 응답에 문제 본문·보기·정답·해설이 모두 포함되어 있어 ("복기" 용도)
 * 별도의 문제 상세 조회 없이 카드 안에서 펼쳐 풀이를 확인할 수 있다.
 */

import type { Difficulty, ExamType } from "@/features/questions/types"

export interface WrongNote {
    id: number
    questionId: number
    content: string
    option1: string
    option2: string
    option3: string
    option4: string
    answer: number          // 1~4
    explanation: string | null
    difficulty: Difficulty
    categoryId: number
    categoryName: string
    examType: ExamType
    memo: string | null
    isResolved: boolean
    createdAt: string
    updatedAt: string
}

export interface WrongNoteCreateRequest {
    questionId: number
}

export interface WrongNoteMemoUpdateRequest {
    /** null/빈 문자열 = 메모 지우기 */
    memo: string | null
}
