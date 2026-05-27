import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    ResponsiveContainer,
    BarChart, Bar, Cell,
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts"

import { statisticsApi } from "@/features/statistics/api"
import { overallAccuracy, type CategoryStat, type HistoryItem } from "@/features/statistics/types"
import { AppHeader } from "@/shared/components/AppHeader"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// 차트 팔레트 — 다크/라이트 모두에서 읽히는 고정 색.
const C = {
    good: "#22c55e",     // green-500
    bad: "#ef4444",      // red-500
    primary: "#6366f1",  // indigo-500
    axis: "#9ca3af",     // gray-400
    grid: "#9ca3af33",
}

const accColor = (acc: number) => (acc >= 60 ? C.good : C.bad)

/**
 * 통계 대시보드 (M5).
 *
 * 4개 API 를 각각 적절한 차트로:
 *  - summary       → KPI 카드 4개
 *  - categories    → 카테고리별 정답률 가로 막대 (정답률 60 기준 색)
 *  - weak-points   → 취약 Top5 가로 막대 (낮은 순)
 *  - history       → 완료 시험의 점수 추이 라인 + 최근 응시 리스트
 *
 * 모든 차트는 데이터가 없을 때 안내 문구로 대체 (백엔드가 빈 배열/0 을 안전 반환).
 */
export function StatisticsPage() {
    const summaryQuery = useQuery({
        queryKey: ["stats", "summary"],
        queryFn: async () => (await statisticsApi.summary()).data.data,
    })
    const categoriesQuery = useQuery({
        queryKey: ["stats", "categories"],
        queryFn: async () => (await statisticsApi.categories()).data.data,
    })
    const weakQuery = useQuery({
        queryKey: ["stats", "weak", 5],
        queryFn: async () => (await statisticsApi.weakPoints(5)).data.data,
    })
    const historyQuery = useQuery({
        queryKey: ["stats", "history", { size: 50 }],
        queryFn: async () => (await statisticsApi.history({ size: 50, sort: "startedAt,desc" })).data.data,
    })

    const summary = summaryQuery.data
    const categories = categoriesQuery.data ?? []
    const weak = weakQuery.data ?? []
    const history = historyQuery.data?.content ?? []

    // 완료 시험만 시간순(오래된→최신)으로 — 점수 추이용
    const trend = useMemo(() => {
        return history
            .filter((h) => h.status === "COMPLETED" && h.score !== null)
            .slice()
            .reverse()
            .map((h, i) => ({
                idx: i + 1,
                score: h.score as number,
                label: h.completedAt ? formatShort(h.completedAt) : `#${i + 1}`,
                examType: h.examType,
            }))
    }, [history])

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">통계</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        나의 학습 현황과 취약점을 한눈에
                    </p>
                </div>

                {/* ── KPI 카드 ── */}
                {summaryQuery.isLoading ? (
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
                    </div>
                ) : summary ? (
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        <Kpi label="응시 횟수" value={summary.totalAttempts} suffix="회" />
                        <Kpi label="완료한 시험" value={summary.completedAttempts} suffix="회" />
                        <Kpi label="평균 점수" value={Math.round(summary.averageScore)} suffix="점" />
                        <Kpi label="전체 정답률" value={Math.round(overallAccuracy(summary))} suffix="%" />
                    </div>
                ) : null}

                {/* ── 카테고리별 정답률 ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">카테고리별 정답률</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoriesQuery.isLoading ? (
                            <Skeleton className="h-64" />
                        ) : categories.length === 0 ? (
                            <Empty>아직 푼 문제가 없습니다. 시험을 풀면 카테고리별 정답률이 표시됩니다.</Empty>
                        ) : (
                            <ResponsiveContainer width="100%" height={Math.max(220, categories.length * 42)}>
                                <BarChart data={categories} layout="vertical"
                                    margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                                    <CartesianGrid horizontal={false} stroke={C.grid} />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fill: C.axis, fontSize: 12 }}
                                        tickFormatter={(v) => `${v}%`} />
                                    <YAxis type="category" dataKey="categoryName" width={120}
                                        tick={{ fill: C.axis, fontSize: 12 }} />
                                    <Tooltip content={<CategoryTip />} cursor={{ fill: C.grid }} />
                                    <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                                        {categories.map((c) => (
                                            <Cell key={c.categoryId} fill={accColor(c.accuracy)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* ── 취약 카테고리 + 점수 추이 ── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">취약 카테고리 Top 5</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {weakQuery.isLoading ? (
                                <Skeleton className="h-56" />
                            ) : weak.length === 0 ? (
                                <Empty>데이터가 쌓이면 정답률이 낮은 카테고리를 보여드립니다.</Empty>
                            ) : (
                                <ResponsiveContainer width="100%" height={Math.max(180, weak.length * 40)}>
                                    <BarChart data={weak} layout="vertical"
                                        margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                                        <CartesianGrid horizontal={false} stroke={C.grid} />
                                        <XAxis type="number" domain={[0, 100]} tick={{ fill: C.axis, fontSize: 12 }}
                                            tickFormatter={(v) => `${v}%`} />
                                        <YAxis type="category" dataKey="categoryName" width={110}
                                            tick={{ fill: C.axis, fontSize: 12 }} />
                                        <Tooltip content={<CategoryTip />} cursor={{ fill: C.grid }} />
                                        <Bar dataKey="accuracy" fill={C.bad} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">점수 추이</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {historyQuery.isLoading ? (
                                <Skeleton className="h-56" />
                            ) : trend.length === 0 ? (
                                <Empty>완료한 시험이 없습니다. 시험을 제출하면 점수 변화를 보여드립니다.</Empty>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={trend} margin={{ left: -16, right: 12, top: 8, bottom: 4 }}>
                                        <CartesianGrid stroke={C.grid} />
                                        <XAxis dataKey="label" tick={{ fill: C.axis, fontSize: 11 }} />
                                        <YAxis domain={[0, 100]} tick={{ fill: C.axis, fontSize: 12 }} />
                                        <Tooltip content={<ScoreTip />} cursor={{ stroke: C.grid }} />
                                        <Line type="monotone" dataKey="score" stroke={C.primary}
                                            strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── 최근 응시 이력 ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">최근 응시 이력</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {historyQuery.isLoading ? (
                            <Skeleton className="h-40" />
                        ) : history.length === 0 ? (
                            <Empty>응시 이력이 없습니다.</Empty>
                        ) : (
                            <ul className="divide-y">
                                {history.slice(0, 8).map((h) => <HistoryRow key={h.attemptId} item={h} />)}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

// ───────────────────────────────────────────────────────────────────────────
// 보조 컴포넌트
// ───────────────────────────────────────────────────────────────────────────

function Kpi({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
    return (
        <Card>
            <CardContent className="py-5">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 text-3xl font-bold tabular-nums">
                    {value}
                    {suffix && <span className="text-base text-muted-foreground font-normal ml-0.5">{suffix}</span>}
                </div>
            </CardContent>
        </Card>
    )
}

function Empty({ children }: { children: React.ReactNode }) {
    return (
        <div className="py-10 text-center text-sm text-muted-foreground">{children}</div>
    )
}

function HistoryRow({ item }: { item: HistoryItem }) {
    const completed = item.status === "COMPLETED"
    return (
        <li className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
                <Badge variant="secondary">{item.examType}</Badge>
                {completed
                    ? <span className="text-sm tabular-nums">{item.correctCount} / {item.totalCount} 정답</span>
                    : <span className="text-sm text-muted-foreground">진행 중 ({item.totalCount}문항)</span>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
                {completed && (
                    <span className="text-sm font-bold tabular-nums">{item.score}점</span>
                )}
                <span className="text-xs text-muted-foreground">
                    {formatShort(item.completedAt ?? item.startedAt)}
                </span>
            </div>
        </li>
    )
}

// ── 테마 대응 커스텀 툴팁 (Tailwind 토큰 사용) ──
interface TipPayload { payload: CategoryStat & { label?: string; score?: number; examType?: string } }

function CategoryTip({ active, payload }: { active?: boolean; payload?: TipPayload[] }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
        <div className="rounded-md border bg-popover text-popover-foreground px-3 py-2 text-xs shadow-md">
            <div className="font-medium">[{d.examType}] {d.categoryName}</div>
            <div className="mt-1 text-muted-foreground">
                정답률 <span className="text-foreground font-medium">{Math.round(d.accuracy)}%</span>
                {" · "}{d.totalCorrect}/{d.totalAttempted}
            </div>
        </div>
    )
}

function ScoreTip({ active, payload }: { active?: boolean; payload?: TipPayload[] }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
        <div className="rounded-md border bg-popover text-popover-foreground px-3 py-2 text-xs shadow-md">
            <div className="font-medium">{d.label}</div>
            <div className="mt-1 text-muted-foreground">
                점수 <span className="text-foreground font-medium">{d.score}점</span>
                {d.examType && <> · {d.examType}</>}
            </div>
        </div>
    )
}

function formatShort(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return `${d.getMonth() + 1}/${d.getDate()}`
}
