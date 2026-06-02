import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

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
import type { ErrorBody } from "@/shared/types/api"

const ALL = "ALL"

/**
 * ADMIN 문제 관리 — 목록 + 등록/수정/삭제 액션.
 *
 * 같은 GET /api/v1/questions 를 재사용 (목록은 누구나 조회 가능).
 * 수정/삭제는 백엔드 @PreAuthorize 가 ROLE_ADMIN 검증.
 * 클라이언트 라우트는 AdminRoute 가운터로 비 ADMIN 차단 (UI 분기 전용).
 */
export function AdminQuestionsPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [searchParams, setSearchParams] = useSearchParams()
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

    const examType = (searchParams.get("examType") as ExamType | null) ?? undefined
    const categoryId = searchParams.get("categoryId")
        ? Number(searchParams.get("categoryId"))
        : undefined
    const difficulty = (searchParams.get("difficulty") as Difficulty | null) ?? undefined
    const page = Number(searchParams.get("page") ?? "0")
    const size = 10

    const setParam = (key: string, value: string | null) => {
        const next = new URLSearchParams(searchParams)
        if (value === null || value === "" || value === ALL) next.delete(key)
        else next.set(key, value)
        if (key !== "page") next.delete("page")
        setSearchParams(next, { replace: false })
    }

    const categoriesQuery = useQuery({
        queryKey: ["categories", examType],
        queryFn: async () => (await categoryApi.list(examType)).data.data,
    })

    const listKey = ["admin-questions", { examType, categoryId, difficulty, page, size }] as const
    const listQuery = useQuery({
        queryKey: listKey,
        queryFn: async () =>
            (await questionApi.search({
                examType, categoryId, difficulty, page, size, sort: "id,desc",
            })).data.data,
    })

    const deleteMut = useMutation({
        mutationFn: (id: number) => questionApi.remove(id),
        onSuccess: () => {
            toast.success("문제가 삭제되었습니다.")
            queryClient.invalidateQueries({ queryKey: ["admin-questions"] })
            queryClient.invalidateQueries({ queryKey: ["questions"] })
            setConfirmDeleteId(null)
        },
        onError: (err: AxiosError<ErrorBody>) => {
            toast.error(err.response?.data?.message ?? "삭제에 실패했습니다.")
        },
    })

    const totalPages = listQuery.data?.totalPages ?? 0
    const pageButtons = useMemo(
        () => Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i),
        [totalPages]
    )

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold">문제 관리</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            ADMIN 전용 — 문제 등록/수정/삭제
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {listQuery.data && (
                            <Badge variant="secondary" className="tabular-nums">
                                총 {listQuery.data.totalElements} 문항
                            </Badge>
                        )}
                        <Button onClick={() => navigate("/admin/questions/new")}>
                            + 새 문제 등록
                        </Button>
                    </div>
                </div>

                {/* 필터 */}
                <Card>
                    <CardContent className="py-4 grid gap-3 sm:grid-cols-3">
                        <Filter label="시험 종류">
                            <Select value={examType ?? ALL} onValueChange={(v) => setParam("examType", v)}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>전체</SelectItem>
                                    <SelectItem value="SQLD">SQLD</SelectItem>
                                    <SelectItem value="SQLP">SQLP</SelectItem>
                                </SelectContent>
                            </Select>
                        </Filter>
                        <Filter label="카테고리">
                            <Select value={categoryId ? String(categoryId) : ALL}
                                onValueChange={(v) => setParam("categoryId", v)}>
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
                        </Filter>
                        <Filter label="난이도">
                            <Select value={difficulty ?? ALL}
                                onValueChange={(v) => setParam("difficulty", v)}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>전체</SelectItem>
                                    <SelectItem value="EASY">쉬움</SelectItem>
                                    <SelectItem value="MEDIUM">보통</SelectItem>
                                    <SelectItem value="HARD">어려움</SelectItem>
                                </SelectContent>
                            </Select>
                        </Filter>
                    </CardContent>
                </Card>

                {/* 목록 */}
                {listQuery.isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
                    </div>
                ) : listQuery.isError ? (
                    <Card><CardContent className="py-6 text-destructive text-sm">
                        목록을 불러오지 못했습니다.
                    </CardContent></Card>
                ) : (listQuery.data?.content.length ?? 0) === 0 ? (
                    <Card><CardContent className="py-10 text-center text-muted-foreground">
                        조건에 맞는 문제가 없습니다.
                    </CardContent></Card>
                ) : (
                    <ul className="space-y-2">
                        {listQuery.data!.content.map((q) => (
                            <li key={q.id}>
                                <Card>
                                    <CardContent className="py-3 flex items-start gap-3">
                                        <span className="text-xs font-mono text-muted-foreground pt-0.5 min-w-12">
                                            #{q.id}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium line-clamp-2">{q.content}</p>
                                            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>[{q.examType}] {q.categoryName}</span>
                                                <DifficultyBadge value={q.difficulty} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button variant="outline" size="sm"
                                                onClick={() => navigate(`/admin/questions/${q.id}/edit`)}>
                                                편집
                                            </Button>
                                            <Button variant="ghost" size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setConfirmDeleteId(q.id)}>
                                                삭제
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ul>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                        <Button variant="outline" size="sm" disabled={page <= 0}
                            onClick={() => setParam("page", String(page - 1))}>이전</Button>
                        {pageButtons.map((p) => (
                            <Button key={p} variant={p === page ? "default" : "outline"} size="sm"
                                onClick={() => setParam("page", String(p))}>{p + 1}</Button>
                        ))}
                        <Button variant="outline" size="sm" disabled={page >= totalPages - 1}
                            onClick={() => setParam("page", String(page + 1))}>다음</Button>
                    </div>
                )}
            </main>

            {/* 삭제 확인 모달 */}
            {confirmDeleteId !== null && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setConfirmDeleteId(null)}>
                    <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <CardContent className="py-5 space-y-4">
                            <div>
                                <h3 className="font-medium">문제 삭제</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    문제 #{confirmDeleteId} 를 정말 삭제하시겠습니까? 되돌릴 수 없습니다.
                                </p>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}
                                    disabled={deleteMut.isPending}>취소</Button>
                                <Button variant="default"
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    onClick={() => deleteMut.mutate(confirmDeleteId)}
                                    disabled={deleteMut.isPending}>
                                    {deleteMut.isPending ? "삭제 중..." : "삭제"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {children}
        </label>
    )
}
