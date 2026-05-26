import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

import { authApi } from "@/features/auth/api"
import { useAuthStore } from "@/features/auth/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { ThemeToggle } from "@/shared/components/ThemeToggle"
import type { ErrorBody } from "@/shared/types/api"

export function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()
    const setTokens = useAuthStore((s) => s.setTokens)
    const setUser = useAuthStore((s) => s.setUser)

    const mutation = useMutation({
        mutationFn: () => authApi.login({ email, password }),
        onSuccess: (res) => {
            const { accessToken, refreshToken } = res.data.data
            setTokens(accessToken, refreshToken)
            setUser({ email })
            toast.success("로그인 성공")
            navigate("/", { replace: true })
        },
        onError: (err: AxiosError<ErrorBody>) => {
            toast.error(err.response?.data?.message ?? "로그인에 실패했습니다.")
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        mutation.mutate()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">로그인</CardTitle>
                    <CardDescription>SQLD/SQLP 문제은행</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">이메일</Label>
                            <Input id="email" type="email" autoComplete="email" required
                                placeholder="user@example.com"
                                value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">비밀번호</Label>
                            <Input id="password" type="password" autoComplete="current-password" required
                                value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending ? "로그인 중..." : "로그인"}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            계정이 없으신가요?{" "}
                            <Link to="/signup" className="text-primary hover:underline">
                                회원가입
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
