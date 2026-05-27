import { Link, useLocation, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { authApi } from "@/features/auth/api"
import { useAuthStore } from "@/features/auth/store"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./ThemeToggle"
import { cn } from "@/lib/utils"

/**
 * 로그인 후 모든 페이지가 공유하는 헤더.
 * 좌측 = 로고/네비게이션, 우측 = 사용자 이메일 + 테마 토글 + 로그아웃.
 */
export function AppHeader() {
    const navigate = useNavigate()
    const location = useLocation()
    const user = useAuthStore((s) => s.user)
    const clear = useAuthStore((s) => s.clear)

    const logout = useMutation({
        mutationFn: () => authApi.logout(),
        onSettled: () => {
            // 서버 무효화 실패해도 클라이언트는 비움 (오프라인 시 UX)
            clear()
            toast.success("로그아웃 되었습니다")
            navigate("/login", { replace: true })
        },
    })

    const navItems: { to: string; label: string; match?: string }[] = [
        { to: "/", label: "홈" },
        { to: "/questions", label: "문제" },
        { to: "/exams/new", label: "시험", match: "/exams" },
        { to: "/wrong-notes", label: "오답노트" },
        { to: "/statistics", label: "통계" },
    ]

    return (
        <header className="border-b bg-background sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <Link to="/" className="text-lg font-bold">SQLQuiz</Link>
                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const prefix = item.match ?? item.to
                            const active =
                                prefix === "/"
                                    ? location.pathname === "/"
                                    : location.pathname.startsWith(prefix)
                            return (
                                <Link key={item.to} to={item.to}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-sm transition-colors",
                                        active
                                            ? "bg-secondary text-secondary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                    )}>
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
                    <ThemeToggle />
                    <Button variant="outline" size="sm" onClick={() => logout.mutate()}>
                        로그아웃
                    </Button>
                </div>
            </div>
        </header>
    )
}
