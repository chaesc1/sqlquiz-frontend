import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

import { categoryApi } from "@/features/questions/api"
import { wrongNoteApi, type WrongNoteListParams } from "@/features/wrong-notes/api"
import type { WrongNote } from "@/features/wrong-notes/types"
import { AppHeader } from "@/shared/components/AppHeader"
import { DifficultyBadge } from "@/shared/components/DifficultyBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { ErrorBody, PageResponse } from "@/shared/types/api"
import { cn } from "@/lib/utils"

const ALL = "ALL"
type Option = 1 | 2 | 3 | 4
const OPTIONS: Option[] = [1, 2, 3, 4]

const RESOLVED_LABEL: Record<string, string> = {
    false: "미해결",
    true: "해결됨",
}

/**
 * 오답노트 페이지.
 *
 * 학습 포인트 — React Query Optimistic Update:
 *  - 해결 토글 / 삭제 / 메모 저장은 서버 응답을 기다리지 않고 캐시를 먼저 바꾼다(onMutate).
 *  - 실패 시 onError 에서 스냅샷으로 롤백, onSettled 에서 invalidate 로 서버 진실과 재동기화.
 *  - 모든 mutation 이 같은 list queryKey 를 공유하므로 한 곳만 패치하면 화면이 갱신된다.
 *
 * URL 쿼리스트링에 필터/페이지를 동기화 (목록 페이지와 동일 패턴).
 */
export function WrongNotesPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const queryClient = useQueryClient()

    const categoryId = searchParams.get("categoryId")
        ? Number(searchParams.get("categoryId"))
        : undefined
    const resolvedParam = searchParams.get("isResolved")  // "true" | "false" | null
    const isResolved = resolvedParam === null ? undefined : resolvedParam === "true"
    const page = Number(searchParams.get("page") ?? "0")
    const size = 10

    const listParams: WrongNoteListParams = {
        categoryId, isResolved, page, size, sort: "createdAt,desc",
    }
    const listKey = ["wrong-notes", listParams] as const

    const setParam = (key: string, value: string | null) => {
        const next = new URLSearchParams(searchParams)
        if (value === null || value === "" || value === ALL) next.delete(key)
        else next.set(key, value)
        if (key !== "page") next.delete("page")
        setSearchParams(next, { replace: false })
    }

    const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: false })

    const categoriesQuery = useQuery({
        queryKey: ["categories", undefined],
        queryFn: async () => (await categoryApi.list()).data.data,
    })

    const notesQuery = useQuery({
        queryKey: listKey,
        queryFn: async () => (await wrongNoteApi.list(listParams)).data.data,
    })

    // ── 캐시 헬퍼: 현재 list 캐시를 부분 변경 ──
    const patchCache = (recipe: (page: PageResponse<WrongNote>) => PageResponse<WrongNote>) => {
        queryClient.setQueryData<PageResponse<WrongNote>>(listKey, (prev) =>
            prev ? recipe(prev) : prev
        )
    }

    // ── 해결 토글 (멱등 → 항상 true 로) ──
    const resolveMut = useMutation({
        mutationFn: (id: number) => wrongNoteApi.resolve(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: listKey })
            const snapshot = queryClient.getQueryData<PageResponse<WrongNote>>(listKey)
            patchCache((p) => ({
                ...p,
                content: p.content.map((n) => (n.id === id ? { ...n, isResolved: true } : n)),
            }))
            return { snapshot }
        },
        onError: (err: AxiosError<ErrorBody>, _id, ctx) => {
            if (ctx?.snapshot) queryClient.setQueryData(listKey, ctx.snapshot)
            toast.error(err.response?.data?.message ?? "해결 표시에 실패했습니다.")
        },
        onSuccess: () => toast.success("해결로 표시했습니다."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["wrong-notes"] }),
    })

    // ── 삭제 ──
    const deleteMut = useMutation({
        mutationFn: (id: number) => wrongNoteApi.remove(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: listKey })
            const snapshot = queryClient.getQueryData<PageResponse<WrongNote>>(listKey)
            patchCache((p) => ({
                ...p,
                content: p.content.filter((n) => n.id !== id),
                totalElements: Math.max(0, p.totalElements - 1),
            }))
            return { snapshot }
        },
        onError: (err: AxiosError<ErrorBody>, _id, ctx) => {
            if (ctx?.snapshot) queryClient.setQueryData(listKey, ctx.snapshot)
            toast.error(err.response?.data?.message ?? "삭제에 실패했습니다.")
        },
        onSuccess: () => toast.success("오답노트에서 삭제했습니다."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["wrong-notes"] }),
    })

    // ── 메모 저장 ──
    const memoMut = useMutation({
        mutationFn: ({ id, memo }: { id: number; memo: string | null }) =>
            wrongNoteApi.updateMemo(id, { memo }),
        onMutate: async ({ id, memo }) => {
            await queryClient.cancelQueries({ queryKey: listKey })
            const snapshot = queryClient.getQueryData<PageResponse<WrongNote>>(listKey)
            patchCache((p) => ({
                ...p,
                content: p.content.map((n) => (n.id === id ? { ...n, memo } : n)),
            }))
            return { snapshot }
        },
        onError: (err: AxiosError<ErrorBody>, _vars, ctx) => {
            if (ctx?.snapshot) queryClient.setQueryData(listKey, ctx.snapshot)
            toast.error(err.response?.data?.message ?? "메모 저장에 실패했습니다.")
        },
        onSuccess: () => toast.success("메모를 저장했습니다."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["wrong-notes"] }),
    })

    const totalPages = notesQuery.data?.totalPages ?? 0
    const pageButtons = useMemo(
        () => Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i),
        [totalPages]
    )

    const activeChips: { key: string; label: string }[] = []
    if (categoryId) {
        const cat = categoriesQuery.data?.find((c) => c.id === categoryId)
        activeChips.push({ key: "categoryId", label: cat?.name ?? `카테고리 ${categoryId}` })
    }
    if (resolvedParam !== null) {
        activeChips.push({ key: "isResolved", label: RESOLVED_LABEL[resolvedParam] })
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold">오답노트</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            틀린 문제를 복기하고 메모를 남겨보세요
                        </p>
                    </div>
                    {notesQuery.data && (
                        <div className="text-right">
                            <div className="text-2xl font-bold tabular-nums">
                                {notesQuery.data.totalElements}
                            </div>
                            <div className="text-xs text-muted-foreground">전체 오답</div>
                        </div>
                    )}
                </div>

                {/* 필터 */}
                <Card>
                    <CardContent className="py-4 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">필터</span>
                            {activeChips.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>초기화</Button>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="space-y-1.5 block">
                                <span className="text-xs font-medium text-muted-foreground">카테고리</span>
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
                            </label>

                            <label className="space-y-1.5 block">
                                <span className="text-xs font-medium text-muted-foreground">해결 여부</span>
                                <Select
                                    value={resolvedParam ?? ALL}
                                    onValueChange={(v) => setParam("isResolved", v)}
                                >
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>전체</SelectItem>
                                        <SelectItem value="false">미해결</SelectItem>
                                        <SelectItem value="true">해결됨</SelectItem>
                                    </SelectContent>
                                </Select>
                            </label>
                        </div>

                        {activeChips.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap pt-1 border-t">
                                <span className="text-xs text-muted-foreground pt-2">적용 중:</span>
                                {activeChips.map((chip) => (
                                    <Badge key={chip.key} variant="secondary"
                                        className="mt-2 cursor-pointer gap-1 hover:bg-secondary/70"
                                        onClick={() => setParam(chip.key, null)}>
                                        {chip.label}
                                        <span aria-hidden className="text-muted-foreground">✕</span>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 목록 */}
                {notesQuery.isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
                    </div>
                ) : notesQuery.isError ? (
                    <Card><CardContent className="py-6 text-destructive text-sm">
                        오답노트를 불러오지 못했습니다.
                    </CardContent></Card>
                ) : (notesQuery.data?.content.length ?? 0) === 0 ? (
                    <Card><CardContent className="py-10 text-center text-muted-foreground">
                        조건에 맞는 오답노트가 없습니다. 시험을 풀면 틀린 문제가 자동으로 등록됩니다.
                    </CardContent></Card>
                ) : (
                    <ul className="space-y-3">
                        {notesQuery.data!.content.map((note) => (
                            <li key={note.id}>
                                <WrongNoteCard
                                    note={note}
                                    onResolve={() => resolveMut.mutate(note.id)}
                                    onDelete={() => deleteMut.mutate(note.id)}
                                    onSaveMemo={(memo) => memoMut.mutate({ id: note.id, memo })}
                                    saving={memoMut.isPending && memoMut.variables?.id === note.id}
                                />
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
        </div>
    )
}

// ───────────────────────────────────────────────────────────────────────────
// 개별 오답노트 카드 — 펼치기/복기 + 메모 + 액션
// ───────────────────────────────────────────────────────────────────────────

interface WrongNoteCardProps {
    note: WrongNote
    onResolve: () => void
    onDelete: () => void
    onSaveMemo: (memo: string | null) => void
    saving: boolean
}

function WrongNoteCard({ note, onResolve, onDelete, onSaveMemo, saving }: WrongNoteCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [memoDraft, setMemoDraft] = useState(note.memo ?? "")

    // 서버/캐시 memo 가 바뀌면 (다른 곳에서 저장) draft 동기화 — 편집 중이 아닐 때만
    const memoChanged = (memoDraft.trim() || null) !== (note.memo ?? null)

    return (
        <Card className={cn(note.isResolved && "opacity-70")}>
            <CardContent className="py-4 space-y-3">
                <div className="flex items-start gap-3">
                    <span className="text-xs font-mono text-muted-foreground pt-0.5 min-w-10">
                        #{note.questionId}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium", !expanded && "line-clamp-2")}>
                            {note.content}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span>[{note.examType}] {note.categoryName}</span>
                            <DifficultyBadge value={note.difficulty} />
                            {note.isResolved
                                ? <Badge variant="secondary">해결됨</Badge>
                                : <Badge variant="destructive">미해결</Badge>}
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
                        {expanded ? "접기" : "펼치기"}
                    </Button>
                </div>

                {expanded && (
                    <div className="space-y-4 border-t pt-4">
                        {/* 보기 — 정답 강조 */}
                        <ol className="space-y-2">
                            {OPTIONS.map((n) => {
                                const text = note[`option${n}` as const]
                                const isAnswer = note.answer === n
                                return (
                                    <li key={n}
                                        className={cn(
                                            "flex items-start gap-3 p-2.5 rounded-md border text-sm",
                                            isAnswer
                                                ? "border-primary bg-primary/10"
                                                : "border-border opacity-70"
                                        )}>
                                        <span className={cn("font-bold w-6 shrink-0", isAnswer && "text-primary")}>
                                            {n}.
                                        </span>
                                        <span className="flex-1 leading-relaxed">{text}</span>
                                        {isAnswer && (
                                            <span className="text-xs text-primary font-medium shrink-0">정답</span>
                                        )}
                                    </li>
                                )
                            })}
                        </ol>

                        {note.explanation && (
                            <section>
                                <h3 className="text-sm font-medium mb-1">해설</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {note.explanation}
                                </p>
                            </section>
                        )}

                        {/* 메모 */}
                        <section className="space-y-2">
                            <h3 className="text-sm font-medium">내 메모</h3>
                            <Textarea
                                value={memoDraft}
                                onChange={(e) => setMemoDraft(e.target.value)}
                                placeholder="이 문제에서 헷갈렸던 포인트를 적어두세요"
                                maxLength={2000}
                                rows={3}
                            />
                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    disabled={!memoChanged || saving}
                                    onClick={() => onSaveMemo(memoDraft.trim() || null)}
                                >
                                    {saving ? "저장 중..." : "메모 저장"}
                                </Button>
                            </div>
                        </section>

                        {/* 액션 */}
                        <div className="flex items-center justify-between border-t pt-3">
                            <Button variant="ghost" size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={onDelete}>
                                삭제
                            </Button>
                            {!note.isResolved && (
                                <Button variant="outline" size="sm" onClick={onResolve}>
                                    해결로 표시
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
