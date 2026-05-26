import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { authApi } from "@/features/auth/api"
import { useAuthStore } from "@/features/auth/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/shared/components/ThemeToggle"

export function HomePage() {
    const user = useAuthStore((s) => s.user)
    const clear = useAuthStore((s) => s.clear)

    const logout = useMutation({
        mutationFn: () => authApi.logout(),
        onSettled: () => {
            clear()
            toast.success("로그아웃 되었습니다")
        },
    })

    return (
        <div className="min-h-screen bg-background p-4">
            <header className="flex justify-between items-center max-w-4xl mx-auto mb-8">
                <h1 className="text-2xl font-bold">SQLQuiz</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{user?.email}</span>
                    <ThemeToggle />
                    <Button variant="outline" size="sm" onClick={() => logout.mutate()}>
                        로그아웃
                    </Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>📚 문제 풀기</CardTitle>
                        <CardDescription>준비 중 — M2 마일스톤</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" disabled>곧 출시</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>📝 시험 응시</CardTitle>
                        <CardDescription>준비 중 — M3 마일스톤</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" disabled>곧 출시</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>❌ 오답노트</CardTitle>
                        <CardDescription>준비 중 — M4 마일스톤</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" disabled>곧 출시</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>📊 통계</CardTitle>
                        <CardDescription>준비 중 — M5 마일스톤</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="secondary" disabled>곧 출시</Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
