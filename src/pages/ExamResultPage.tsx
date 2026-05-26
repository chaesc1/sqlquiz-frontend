import { useNavigate, useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { examApi } from "@/features/exams/api"
import { AppHeader } from "@/shared/components/AppHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * 시험 결과 페이지.
 *
 * - 점수 / 정답 수 / 카테고리별 통계를 보여준다.
 * - 본격 차트는 M5(Recharts)에서 도입 — 일단 가로 막대형 진행률 + 표 형태.
 */
export function ExamResultPage() {
    const { id } = useParams<{ id: string }>()
    const attemptId = id ?? ""
    const navigate = useNavigate()

    const resultQuery = useQuery({
        queryKey: ["exam-result", attemptId],
        queryFn: async () => (await examApi.result(attemptId)).data.data,
        enabled: Boolean(attemptId),
    })

    if (resultQuery.isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader />
                <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-40" />
                </main>
            </div>
        )
    }

    if (resultQuery.isError || !resultQuery.data) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader />
                <main className="max-w-3xl mx-auto px-4 py-6">
                    <Card><CardContent className="py-6 text-destructive text-sm">
                        결과를 불러오지 못했습니다.
                    </CardContent></Card>
                </main>
            </div>
        )
    }

    const r = resultQuery.data
    const passed = r.score >= 60   // 60점을 통과 기준선으로 표기 (실제 자격증 합격 기준과 별개의 시각 보조)

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">시험 결과</h1>
                    <Badge variant="secondary">{r.examType}</Badge>
                </div>

                {/* 점수 카드 */}
                <Card>
                    <CardContent className="py-8 flex flex-col items-center gap-2">
                        <div className={cn(
                            "text-6xl font-bold tabular-nums",
                            passed ? "text-primary" : "text-destructive"
                        )}>
                            {r.score}
                            <span className="text-2xl text-muted-foreground font-normal">/100</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            정답 {r.correctCount} / {r.totalCount} 문항
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {new Date(r.completedAt).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>

                {/* 카테고리별 통계 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">카테고리별 정답률</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {r.categoryStats.length === 0 ? (
                            <p className="text-sm text-muted-foreground">표시할 카테고리가 없습니다.</p>
                        ) : (
                            <ul className="space-y-3">
                                {r.categoryStats.map((c) => {
                                    const ratio = c.total === 0 ? 0 : (c.correct / c.total) * 100
                                    return (
                                        <li key={c.categoryName} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{c.categoryName}</span>
                                                <span className="tabular-nums text-muted-foreground">
                                                    {c.correct} / {c.total}
                                                    <span className="ml-2 text-foreground font-medium">
                                                        {ratio.toFixed(0)}%
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full transition-all",
                                                        ratio >= 60 ? "bg-primary" : "bg-destructive"
                                                    )}
                                                    style={{ width: `${ratio}%` }}
                                                />
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* 액션 */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <Link
                        to={`/exams/${attemptId}`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        풀이 다시보기
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate("/")}>
                            대시보드
                        </Button>
                        <Button onClick={() => navigate("/exams/new")}>
                            다시 응시
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}
