import { useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { categoryApi, questionApi } from "@/features/questions/api"
import type { Difficulty, ExamType } from "@/features/questions/types"
import { AppHeader } from "@/shared/components/AppHeader"
import { DifficultyBadge } from "@/shared/components/DifficultyBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const ALL = "ALL"

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
    EASY: "쉬움",
    MEDIUM: "보통",
    HARD: "어려움",
}

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
        if (key !== "page") next.delete("page")    // 필터 변경 시 page 리셋
        setSearchParams(next, { replace: false })
    }

    const clearAllFilters = () => {
        setSearchParams(new URLSearchParams(), { replace: false })
    }

    const categoriesQuery = useQuery({
        queryKey: ["categories", examType],
        queryFn: async () => (await categoryApi.list(examType)).data.data,
    })

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

    // 활성 필터 chip 데이터 — 비어있지 않은 것만
    const activeChips: { key: string; label: string }[] = []
    if (examType) activeChips.push({ key: "examType", label: examType })
    if (categoryId) {
        const cat = categoriesQuery.data?.find((c) => c.id === categoryId)
        activeChips.push({ key: "categoryId", label: cat?.name ?? `카테고리 ${categoryId}` })
    }
    if (difficulty) activeChips.push({ key: "difficulty", label: DIFFICULTY_LABEL[difficulty] })

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                {/* 헤더: 타이틀 + 결과 카운트 */}
                <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold">문제 목록</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            조건에 맞는 문제를 골라 풀어보세요
                        </p>
                    </div>
                    {questionsQuery.data && (
                        <div className="text-right">
                            <div className="text-2xl font-bold tabular-nums">
                                {questionsQuery.data.totalElements}
                            </div>
                            <div className="text-xs text-muted-foreground">총 문제 수</div>
                        </div>
                    )}
                </div>

                {/* 필터 패널 */}
                <Card>
                    <CardContent className="py-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">필터</span>
                            {activeChips.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                                    초기화
                                </Button>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <FilterField label="시험 종류">
                                <Select value={examType ?? ALL} onValueChange={(v) => setParam("examType", v)}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>전체</SelectItem>
                                        <SelectItem value="SQLD">SQLD</SelectItem>
                                        <SelectItem value="SQLP">SQLP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FilterField>

                            <FilterField label="카테고리">
                                <Select
                                    value={categoryId ? String(categoryId) : ALL}
                                    onValueChange={(v) => setParam("categoryId", v)}
                                >
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>전체</SelectItem>
                                        {(categoriesQuery.data ?? []).map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                [{c.examType}] {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FilterField>

                            <FilterField label="난이도">
                                <Select value={difficulty ?? ALL} onValueChange={(v) => setParam("difficulty", v)}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>전체</SelectItem>
                                        <SelectItem value="EASY">쉬움</SelectItem>
                                        <SelectItem value="MEDIUM">보통</SelectItem>
                                        <SelectItem value="HARD">어려움</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FilterField>
                        </div>

                        {/* 활성 필터 chip — 클릭으로 개별 제거 */}
                        {activeChips.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap pt-1 border-t">
                                <span className="text-xs text-muted-foreground pt-2">적용 중:</span>
                                {activeChips.map((chip) => (
                                    <Badge
                                        key={chip.key}
                                        variant="secondary"
                                        className="mt-2 cursor-pointer gap-1 hover:bg-secondary/70"
                                        onClick={() => setParam(chip.key, null)}
                                    >
                                        {chip.label}
                                        <span aria-hidden className="text-muted-foreground">✕</span>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

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
                                <Link
                                    to={{
                                        pathname: `/questions/${q.id}`,
                                        search: searchParams.toString(),
                                    }}
                                    className="block"
                                >
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
            </main>
        </div>
    )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {children}
        </label>
    )
}
