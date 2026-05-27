import { useNavigate } from "react-router-dom"
import { AppHeader } from "@/shared/components/AppHeader"
import { Button } from "@/components/ui/button"
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"

/**
 * 홈 — 도메인별 진입 카드.
 * 활성 카드는 라우트 이동, 미구현은 disabled.
 */
export function HomePage() {
    const navigate = useNavigate()
    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-5xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-1">대시보드</h1>
                <p className="text-sm text-muted-foreground mb-6">
                    SQLD/SQLP 자격증 시험 대비
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>📚 문제 풀기</CardTitle>
                            <CardDescription>카테고리/난이도로 필터해 자유롭게 풀어보기</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => navigate("/questions")}>문제 보러가기</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>📝 시험 응시</CardTitle>
                            <CardDescription>무작위 N문제 출제 → 자동 채점 + 오답노트 등록</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => navigate("/exams/new")}>시험 시작</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>❌ 오답노트</CardTitle>
                            <CardDescription>틀린 문제 복기 + 메모, 해결 표시로 관리</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => navigate("/wrong-notes")}>오답노트 보기</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>📊 통계</CardTitle>
                            <CardDescription>정답률·취약 카테고리·점수 추이를 차트로</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => navigate("/statistics")}>통계 보기</Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
