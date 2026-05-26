import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { questionApi } from "@/features/questions/api"
import type { Difficulty, ExamType, Question } from "@/features/questions/types"
import { AppHeader } from "@/shared/components/AppHeader"
import { DifficultyBadge } from "@/shared/components/DifficultyBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { PageResponse } from "@/shared/types/api"
import { cn } from "@/lib/utils"

type Option = 1 | 2 | 3 | 4
const OPTIONS: Option[] = [1, 2, 3, 4]

/**
 * 문제 상세 페이지 — 풀이형 + 다음/이전 문제 네비게이션.
 *
 * 동작:
 *  - 진입 시 정답/해설 숨김
 *  - 보기 클릭으로 답 선택, "확인" 으로 채점
 *  - "다음 문제" → 같은 필터 컨텍스트 안에서 인접 문제로 이동
 *  - 페이지 경계에서는 다음 페이지를 자동으로 prefetch
 *
 * URL 쿼리스트링이 목록 페이지와 동일한 키(examType, categoryId, difficulty, page)를
 * 그대로 운반하므로 React Query 캐시가 자연스럽게 적중한다.
 */
export function QuestionDetailPage() {
    const { id } = useParams<{ id: string }>()
    const questionId = Number(id)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const queryClient = useQueryClient()

    const [selected, setSelected] = useState<Option | null>(null)
    const [submitted, setSubmitted] = useState(false)

    // path param 이 바뀌면 풀이 상태 리셋
    useEffect(() => {
        setSelected(null)
        setSubmitted(false)
    }, [questionId])

    // ── 상세 ──
    const detailQuery = useQuery({
        queryKey: ["question", questionId],
        queryFn: async () => (await questionApi.detail(questionId)).data.data,
        enabled: Number.isFinite(questionId),
    })

    // ── 같은 필터의 목록 — 인접 ID 계산용 ──
    const examType = (searchParams.get("examType") as ExamType | null) ?? undefined
    const categoryId = searchParams.get("categoryId")
        ? Number(searchParams.get("categoryId"))
        : undefined
    const difficulty = (searchParams.get("difficulty") as Difficulty | null) ?? undefined
    const page = Number(searchParams.get("page") ?? "0")
    const size = 10

    const listKey = useMemo(
        () => ["questions", { examType, categoryId, difficulty, page, size }] as const,
        [examType, categoryId, difficulty, page]
    )

    const listQuery = useQuery({
        queryKey: listKey,
        queryFn: async () => (await questionApi.search({
            examType, categoryId, difficulty, page, size, sort: "id,asc",
        })).data.data,
    })

    // 인접 문제 ID 계산. 페이지 경계는 prev/next 페이지를 미리 fetch 해서 처리.
    const { prevId, nextId, isLast } = useNeighbors({
        currentId: questionId,
        list: listQuery.data,
        params: { examType, categoryId, difficulty, page, size },
        queryClient,
    })

    const goTo = (targetId: number, newPage?: number) => {
        const nextParams = new URLSearchParams(searchParams)
        if (newPage !== undefined) nextParams.set("page", String(newPage))
        navigate({
            pathname: `/questions/${targetId}`,
            search: nextParams.toString(),
        })
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-3xl mx-auto px-4 py-6">
                <Link
                    to={{ pathname: "/questions", search: searchParams.toString() }}
                    className="inline-block mb-4 text-sm text-muted-foreground hover:text-foreground"
                >
                    ← 목록으로
                </Link>

                {detailQuery.isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-32" />
                    </div>
                ) : detailQuery.isError || !detailQuery.data ? (
                    <Card><CardContent className="py-6 text-destructive text-sm">
                        문제를 찾을 수 없습니다.
                    </CardContent></Card>
                ) : (() => {
                    const q = detailQuery.data
                    const isCorrect = submitted && selected === q.answer
                    return (
                        <Card>
                            <CardHeader className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>#{q.id}</span>
                                    <span>·</span>
                                    <span>[{q.examType}] {q.categoryName}</span>
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
                                        const isAnswer = q.answer === n
                                        const showCorrect = submitted && isAnswer
                                        const showWrong = submitted && isSelected && !isAnswer
                                        return (
                                            <li key={n}>
                                                <button
                                                    type="button"
                                                    disabled={submitted}
                                                    onClick={() => setSelected(n)}
                                                    className={cn(
                                                        "w-full text-left flex items-start gap-3 p-3 rounded-md border transition-colors",
                                                        "hover:bg-secondary/40 disabled:cursor-default",
                                                        !submitted && isSelected && "border-primary bg-primary/5",
                                                        showCorrect && "border-primary bg-primary/10",
                                                        showWrong && "border-destructive bg-destructive/10",
                                                        !submitted && !isSelected && "border-border",
                                                        submitted && !isAnswer && !isSelected && "opacity-60",
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "font-bold w-6 shrink-0",
                                                        showCorrect && "text-primary",
                                                        showWrong && "text-destructive",
                                                    )}>
                                                        {n}.
                                                    </span>
                                                    <span className="text-sm leading-relaxed flex-1">{text}</span>
                                                    {showCorrect && (
                                                        <span className="text-xs text-primary font-medium shrink-0">정답</span>
                                                    )}
                                                    {showWrong && (
                                                        <span className="text-xs text-destructive font-medium shrink-0">선택 ✕</span>
                                                    )}
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ol>

                                {!submitted ? (
                                    <div className="flex items-center justify-end gap-2 pt-2">
                                        <Button
                                            disabled={selected === null}
                                            onClick={() => setSubmitted(true)}
                                        >
                                            확인
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className={cn(
                                            "text-sm font-medium",
                                            isCorrect ? "text-primary" : "text-destructive"
                                        )}>
                                            {isCorrect
                                                ? "✅ 정답입니다!"
                                                : `❌ 오답입니다. 정답은 ${q.answer}번입니다.`}
                                        </div>

                                        {q.explanation && (
                                            <section className="border-t pt-4">
                                                <h3 className="text-sm font-medium mb-2">해설</h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                    {q.explanation}
                                                </p>
                                            </section>
                                        )}

                                        {/* 네비게이션 액션 */}
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <Button
                                                variant="outline"
                                                disabled={prevId === null}
                                                onClick={() => prevId !== null && goTo(prevId.id, prevId.page)}
                                            >
                                                ← 이전 문제
                                            </Button>

                                            <Button variant="ghost" onClick={() => { setSelected(null); setSubmitted(false) }}>
                                                다시 풀기
                                            </Button>

                                            {isLast ? (
                                                <Button variant="default" disabled>
                                                    마지막 문제
                                                </Button>
                                            ) : (
                                                <Button
                                                    disabled={nextId === null}
                                                    onClick={() => nextId !== null && goTo(nextId.id, nextId.page)}
                                                >
                                                    다음 문제 →
                                                </Button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )
                })()}
            </main>
        </div>
    )
}

// ───────────────────────────────────────────────────────────────────────────
// 인접 문제 ID 계산
// ───────────────────────────────────────────────────────────────────────────

interface NeighborTarget { id: number; page: number }

interface UseNeighborsArgs {
    currentId: number
    list: PageResponse<Question> | undefined
    params: {
        examType?: ExamType
        categoryId?: number
        difficulty?: Difficulty
        page: number
        size: number
    }
    queryClient: ReturnType<typeof useQueryClient>
}

/**
 * 현재 페이지 안에서 prev/next 문제 ID를 찾는다.
 * 페이지 경계(현재 페이지의 첫/마지막 문제) 인 경우 인접 페이지를 prefetch 해서 채워준다.
 *
 * 의도적으로 fetch 결과를 await 하지 않고 캐시에서 즉시 읽기만 함 — 같은 흐름으로
 * "다음 문제" 를 빠르게 누르고 싶을 때, 첫 번째 클릭은 prefetch 중이라 disabled 일 수도 있다.
 * 그 다음 클릭부터는 캐시 적중으로 즉시 응답.
 */
function useNeighbors({
    currentId, list, params, queryClient,
}: UseNeighborsArgs): { prevId: NeighborTarget | null; nextId: NeighborTarget | null; isLast: boolean } {
    const { page, size, examType, categoryId, difficulty } = params

    // 페이지 경계용 prefetch
    useEffect(() => {
        if (!list) return
        const idx = list.content.findIndex((q) => q.id === currentId)
        if (idx === -1) return

        const needPrevPage = idx === 0 && page > 0
        const needNextPage = idx === list.content.length - 1 && !list.last

        const fetchPage = (targetPage: number) =>
            queryClient.prefetchQuery({
                queryKey: ["questions", { examType, categoryId, difficulty, page: targetPage, size }],
                queryFn: async () => (await questionApi.search({
                    examType, categoryId, difficulty, page: targetPage, size, sort: "id,asc",
                })).data.data,
            })

        if (needPrevPage) fetchPage(page - 1)
        if (needNextPage) fetchPage(page + 1)
    }, [list, currentId, page, size, examType, categoryId, difficulty, queryClient])

    if (!list) return { prevId: null, nextId: null, isLast: false }

    const idx = list.content.findIndex((q) => q.id === currentId)
    if (idx === -1) return { prevId: null, nextId: null, isLast: false }

    let prevId: NeighborTarget | null = null
    let nextId: NeighborTarget | null = null

    if (idx > 0) {
        prevId = { id: list.content[idx - 1].id, page }
    } else if (page > 0) {
        const cachedPrev = queryClient.getQueryData<PageResponse<Question>>([
            "questions", { examType, categoryId, difficulty, page: page - 1, size },
        ])
        if (cachedPrev && cachedPrev.content.length > 0) {
            prevId = {
                id: cachedPrev.content[cachedPrev.content.length - 1].id,
                page: page - 1,
            }
        }
    }

    if (idx < list.content.length - 1) {
        nextId = { id: list.content[idx + 1].id, page }
    } else if (!list.last) {
        const cachedNext = queryClient.getQueryData<PageResponse<Question>>([
            "questions", { examType, categoryId, difficulty, page: page + 1, size },
        ])
        if (cachedNext && cachedNext.content.length > 0) {
            nextId = { id: cachedNext.content[0].id, page: page + 1 }
        }
    }

    const isLast = list.last && idx === list.content.length - 1
    return { prevId, nextId, isLast }
}
