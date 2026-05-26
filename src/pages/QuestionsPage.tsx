import { useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { categoryApi, questionApi } from "@/features/questions/api"
import type { Difficulty, ExamType } from "@/features/questions/types"
import { AppHeader } from "@/shared/components/AppHeader"
import { DifficultyBadge } from "@/shared/components/DifficultyBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const ALL = "ALL"

/**
 * 문제 목록 페이지.
 * URL 쿼리스트링에 필터/페이지를 동기화 — 새로고침/공유 가능.
 */
export function QuestionsPage() {
    const [searchParams, setSearchParams] = useSearchParams()

    const examType = (searchParams.get("examType") as ExamType | null) ?? undefined
    const categoryId = searchParams.get("categoryId")
        ? Number(searchParams.get("categoryId"))
        : undefined
    const difficulty = (searchParams.get("difficulty") as Difficulty | null) ?? undefined
    const page = Number(searchParams.get("page") ?? "0")
    const size = 10

    const setParam = (key: string, value: string | null) => {
        const next = new URLSearchParams(searchParams)
        if (value === null || value === "" || value === ALL) {
            next.delete(key)
        } else {
            next.set(key, value)
        }
        // 필터가 바뀌면 page 리셋
        if (key !== "page") next.delete("page")
        setSearchParams(next, { replace: false })
    }

    // 카테고리 목록 — examType 으로 한정
    const categoriesQuery = useQuery({
        queryKey: ["categories", examType],
        queryFn: async () => (await categoryApi.list(examType)).data.data,
    })

    // 문제 목록
    const questionsQuery = useQuery({
        queryKey: ["questions", { examType, categoryId, difficulty, page, size }],
        queryFn: async () =>
            (await questionApi.search({
                examType, categoryId, difficulty, page, size, sort: "id,asc",
            })).data.data,
    })

    const totalPages = questionsQuery.data?.totalPages ?? 0
    const pageButtons = useMemo(
        () => Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i),
        [totalPages]
    )

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                <h1 className="text-2xl font-bold">문제 목록</h1>

                {/* 필터 */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <Select value={examType ?? ALL} onValueChange={(v) => setParam("examType", v)}>
                        <SelectTrigger><SelectValue placeholder="시험 종류" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>전체 시험</SelectItem>
                            <SelectItem value="SQLD">SQLD</SelectItem>
                            <SelectItem value="SQLP">SQLP</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={categoryId ? String(categoryId) : ALL}
                        onValueChange={(v) => setParam("categoryId", v)}
                    >
                        <SelectTrigger><SelectValue placeholder="카테고리" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>전체 카테고리</SelectItem>
                            {(categoriesQuery.data ?? []).map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    [{c.examType}] {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={difficulty ?? ALL} onValueChange={(v) => setParam("difficulty", v)}>
                        <SelectTrigger><SelectValue placeholder="난이도" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>전체 난이도</SelectItem>
                            <SelectItem value="EASY">쉬움</SelectItem>
                            <SelectItem value="MEDIUM">보통</SelectItem>
                            <SelectItem value="HARD">어려움</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 목록 */}
                {questionsQuery.isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
                    </div>
                ) : questionsQuery.isError ? (
                    <Card><CardContent className="py-6 text-destructive text-sm">
                        문제를 불러오지 못했습니다.
                    </CardContent></Card>
                ) : (questionsQuery.data?.content.length ?? 0) === 0 ? (
                    <Card><CardContent className="py-10 text-center text-muted-foreground">
                        조건에 맞는 문제가 없습니다.
                    </CardContent></Card>
                ) : (
                    <ul className="space-y-3">
                        {questionsQuery.data!.content.map((q) => (
                            <li key={q.id}>
                                <Link to={`/questions/${q.id}`} className="block">
                                    <Card className="hover:bg-secondary/40 transition-colors">
                                        <CardContent className="py-4 flex items-start gap-3">
                                            <span className="text-xs font-mono text-muted-foreground pt-0.5 min-w-10">
                                                #{q.id}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium line-clamp-2">{q.content}</p>
                                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>[{q.examType}] {q.categoryName}</span>
                                                    <DifficultyBadge value={q.difficulty} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                        <Button variant="outline" size="sm"
                            disabled={page <= 0}
                            onClick={() => setParam("page", String(page - 1))}>이전</Button>
                        {pageButtons.map((p) => (
                            <Button key={p}
                                variant={p === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setParam("page", String(p))}>
                                {p + 1}
                            </Button>
                        ))}
                        <Button variant="outline" size="sm"
                            disabled={page >= totalPages - 1}
                            onClick={() => setParam("page", String(page + 1))}>다음</Button>
                    </div>
                )}

                {questionsQuery.data && (
                    <p className="text-xs text-muted-foreground text-center">
                        총 {questionsQuery.data.totalElements}개
                    </p>
                )}
            </main>
        </div>
    )
}
