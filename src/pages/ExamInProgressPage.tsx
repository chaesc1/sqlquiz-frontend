import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

import { examApi } from "@/features/exams/api"
import type { AnswerSubmission, QuestionInExam } from "@/features/exams/types"
import { AppHeader } from "@/shared/components/AppHeader"
import { DifficultyBadge } from "@/shared/components/DifficultyBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import type { ErrorBody } from "@/shared/types/api"
import { cn } from "@/lib/utils"

type Option = 1 | 2 | 3 | 4
const OPTIONS: Option[] = [1, 2, 3, 4]

/**
 * 시험 진행 페이지.
 *
 * 설계:
 *  - GET /exams/{id} 로 세션 로드 (이미 COMPLETED 면 곧장 결과 페이지로 리다이렉트)
 *  - 답안은 서버에 즉시 저장하지 않고 로컬 state(answers: Map<questionId, 1~4|null>) 에만 들고 있다가
 *    "최종 제출" 시 한 번에 POST /exams/{id}/submit 으로 일괄 전송.
 *    → 이어풀기를 완벽하게 하려면 매 선택마다 PATCH 가 필요한데, 백엔드 API 가 일괄 제출 방식.
 *      서버에 저장된 selectedOption 으로 초기 시드만 채워 일부 이어풀기를 지원.
 *  - 한 문제씩 보여주는 페이지네이션 + 우측 점프 그리드 (답한 문제 시각화)
 */
export function ExamInProgressPage() {
    const { id } = useParams<{ id: string }>()
    const attemptId = id ?? ""
    const navigate = useNavigate()

    const sessionQuery = useQuery({
        queryKey: ["exam-session", attemptId],
        queryFn: async () => (await examApi.get(attemptId)).data.data,
        enabled: Boolean(attemptId),
        // 시험 진행 중에는 stale 시 다시 fetch 하지 않음 (서버 selectedOption 이 옛것일 수 있음)
        staleTime: Infinity,
    })

    // 완료된 시험이면 결과 페이지로
    useEffect(() => {
        if (sessionQuery.data?.status === "COMPLETED") {
            navigate(`/exams/${attemptId}/result`, { replace: true })
        }
    }, [sessionQuery.data?.status, attemptId, navigate])

    // 답안 로컬 state: questionId -> selectedOption(1~4) | null
    const [answers, setAnswers] = useState<Record<number, number | null>>({})
    const [index, setIndex] = useState(0)
    const [confirmingSubmit, setConfirmingSubmit] = useState(false)

    // 세션 로드 시 서버 selectedOption 으로 초기화
    useEffect(() => {
        if (!sessionQuery.data) return
        const seed: Record<number, number | null> = {}
        for (const q of sessionQuery.data.questions) {
            seed[q.questionId] = q.selectedOption
        }
        setAnswers(seed)
    }, [sessionQuery.data])

    const submitMut = useMutation({
        mutationFn: () => {
            const body = {
                answers: (sessionQuery.data?.questions ?? []).map<AnswerSubmission>((q) => ({
                    questionId: q.questionId,
                    selectedOption: answers[q.questionId] ?? null,
                })),
            }
            return examApi.submit(attemptId, body)
        },
        onSuccess: () => {
            toast.success("채점이 완료되었습니다.")
            navigate(`/exams/${attemptId}/result`, { replace: true })
        },
        onError: (err: AxiosError<ErrorBody>) => {
            toast.error(err.response?.data?.message ?? "제출에 실패했습니다.")
        },
    })

    const questions = sessionQuery.data?.questions ?? []
    const current: QuestionInExam | undefined = questions[index]
    const answeredCount = useMemo(
        () => questions.filter((q) => answers[q.questionId] != null).length,
        [questions, answers]
    )

    if (sessionQuery.isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader />
                <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-64" />
                </main>
            </div>
        )
    }

    if (sessionQuery.isError || !sessionQuery.data) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader />
                <main className="max-w-3xl mx-auto px-4 py-6">
                    <Card><CardContent className="py-6 text-destructive text-sm">
                        시험 세션을 불러오지 못했습니다.
                    </CardContent></Card>
                </main>
            </div>
        )
    }

    const session = sessionQuery.data
    const select = (q: QuestionInExam, n: number) => {
        setAnswers((prev) => ({ ...prev, [q.questionId]: n }))
    }
    const clearSelection = (q: QuestionInExam) => {
        setAnswers((prev) => ({ ...prev, [q.questionId]: null }))
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-5xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[1fr_280px]">
                {/* ── 좌측: 현재 문제 ── */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="secondary">{session.examType}</Badge>
                        <span>진행도</span>
                        <span className="font-medium text-foreground tabular-nums">
                            {index + 1} / {session.totalCount}
                        </span>
                        <span>·</span>
                        <span>응답 {answeredCount} / {session.totalCount}</span>
                    </div>

                    {current && (() => {
                        const q = current
                        const selected = answers[q.questionId] ?? null
                        return (
                            <Card>
                                <CardHeader className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>#{q.questionId}</span>
                                        <span>·</span>
                                        <span>{q.categoryName}</span>
                                        <DifficultyBadge value={q.difficulty} />
                                    </div>
                                    <CardTitle className="text-lg leading-relaxed">
                                        {q.content}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ol className="space-y-2">
                                        {OPTIONS.map((n) => {
                                            const text = q[`option${n}` as const]
                                            const isSelected = selected === n
                                            return (
                                                <li key={n}>
                                                    <button
                                                        type="button"
                                                        onClick={() => select(q, n)}
                                                        className={cn(
                                                            "w-full text-left flex items-start gap-3 p-3 rounded-md border transition-colors",
                                                            "hover:bg-secondary/40",
                                                            isSelected
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border",
                                                        )}
                                                    >
                                                        <span className="font-bold w-6 shrink-0">{n}.</span>
                                                        <span className="text-sm leading-relaxed flex-1">{text}</span>
                                                    </button>
                                                </li>
                                            )
                                        })}
                                    </ol>

                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <Button variant="outline"
                                            disabled={index === 0}
                                            onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                                            ← 이전
                                        </Button>

                                        <Button variant="ghost" size="sm"
                                            disabled={selected === null}
                                            onClick={() => clearSelection(q)}>
                                            선택 해제
                                        </Button>

                                        {index < session.totalCount - 1 ? (
                                            <Button onClick={() => setIndex((i) => Math.min(session.totalCount - 1, i + 1))}>
                                                다음 →
                                            </Button>
                                        ) : (
                                            <Button variant="default" onClick={() => setConfirmingSubmit(true)}>
                                                제출하기
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })()}
                </section>

                {/* ── 우측: 문제 점프 그리드 + 제출 ── */}
                <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
                    <Card>
                        <CardContent className="py-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">문항</span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {answeredCount} / {session.totalCount}
                                </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                                {questions.map((q, i) => {
                                    const answered = answers[q.questionId] != null
                                    const isCurrent = i === index
                                    return (
                                        <button key={q.questionId} type="button"
                                            onClick={() => setIndex(i)}
                                            className={cn(
                                                "h-8 text-xs rounded border tabular-nums transition-colors",
                                                isCurrent && "ring-2 ring-primary ring-offset-1",
                                                answered
                                                    ? "bg-primary/10 border-primary/40 text-primary"
                                                    : "bg-background border-border text-muted-foreground hover:bg-secondary/60",
                                            )}>
                                            {i + 1}
                                        </button>
                                    )
                                })}
                            </div>
                            <Button className="w-full" onClick={() => setConfirmingSubmit(true)}>
                                전체 제출
                            </Button>
                        </CardContent>
                    </Card>
                </aside>
            </main>

            {/* 제출 확인 패널 (간단 모달 대용 — overlay) */}
            {confirmingSubmit && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setConfirmingSubmit(false)}>
                    <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <CardHeader>
                            <CardTitle>시험 제출</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">
                                응답 {answeredCount} / {session.totalCount} 문항.
                                {answeredCount < session.totalCount && (
                                    <span className="text-destructive">
                                        {" "}미응답 {session.totalCount - answeredCount}개는 자동으로 오답 처리됩니다.
                                    </span>
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                제출 후에는 답안을 변경할 수 없습니다.
                            </p>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" onClick={() => setConfirmingSubmit(false)}
                                    disabled={submitMut.isPending}>
                                    취소
                                </Button>
                                <Button onClick={() => submitMut.mutate()}
                                    disabled={submitMut.isPending}>
                                    {submitMut.isPending ? "채점 중..." : "제출"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
