import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { questionApi } from "@/features/questions/api"
import { AppHeader } from "@/shared/components/AppHeader"
import { DifficultyBadge } from "@/shared/components/DifficultyBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * 문제 상세 페이지.
 * 학습 단계 단순화로 정답/해설 즉시 노출 (운영에서는 "시험 완료 후" 분기 필요).
 */
export function QuestionDetailPage() {
    const { id } = useParams<{ id: string }>()
    const questionId = Number(id)

    const query = useQuery({
        queryKey: ["question", questionId],
        queryFn: async () => (await questionApi.detail(questionId)).data.data,
        enabled: Number.isFinite(questionId),
    })

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-3xl mx-auto px-4 py-6">
                <Link to="/questions"
                    className="inline-block mb-4 text-sm text-muted-foreground hover:text-foreground">
                    ← 목록으로
                </Link>

                {query.isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-32" />
                    </div>
                ) : query.isError || !query.data ? (
                    <Card><CardContent className="py-6 text-destructive text-sm">
                        문제를 찾을 수 없습니다.
                    </CardContent></Card>
                ) : (
                    <Card>
                        <CardHeader className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>#{query.data.id}</span>
                                <span>·</span>
                                <span>[{query.data.examType}] {query.data.categoryName}</span>
                                <DifficultyBadge value={query.data.difficulty} />
                            </div>
                            <CardTitle className="text-lg leading-relaxed">
                                {query.data.content}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ol className="space-y-2">
                                {([1, 2, 3, 4] as const).map((n) => {
                                    const text = query.data[`option${n}` as const]
                                    const isAnswer = query.data.answer === n
                                    return (
                                        <li key={n}
                                            className={`flex items-start gap-3 p-3 rounded-md border ${
                                                isAnswer
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border"
                                            }`}>
                                            <span className={`font-bold w-6 shrink-0 ${
                                                isAnswer ? "text-primary" : ""
                                            }`}>
                                                {n}.
                                            </span>
                                            <span className="text-sm leading-relaxed">{text}</span>
                                            {isAnswer && (
                                                <span className="ml-auto text-xs text-primary font-medium">정답</span>
                                            )}
                                        </li>
                                    )
                                })}
                            </ol>

                            {query.data.explanation && (
                                <section className="border-t pt-4">
                                    <h3 className="text-sm font-medium mb-2">해설</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {query.data.explanation}
                                    </p>
                                </section>
                            )}
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    )
}
