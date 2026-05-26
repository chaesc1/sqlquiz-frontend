import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

import { authApi } from "@/features/auth/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { ThemeToggle } from "@/shared/components/ThemeToggle"
import type { ErrorBody } from "@/shared/types/api"

export function SignupPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [nickname, setNickname] = useState("")
    const navigate = useNavigate()

    const mutation = useMutation({
        mutationFn: () => authApi.signup({ email, password, nickname }),
        onSuccess: () => {
            toast.success("회원가입 성공 — 로그인해 주세요")
            navigate("/login", { replace: true })
        },
        onError: (err: AxiosError<ErrorBody>) => {
            toast.error(err.response?.data?.message ?? "회원가입에 실패했습니다.")
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
                    <CardTitle className="text-2xl">회원가입</CardTitle>
                    <CardDescription>SQLD/SQLP 문제은행에 가입합니다</CardDescription>
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
                            <Label htmlFor="nickname">닉네임</Label>
                            <Input id="nickname" required minLength={2} maxLength={20}
                                value={nickname} onChange={(e) => setNickname(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">비밀번호 (8자 이상)</Label>
                            <Input id="password" type="password" autoComplete="new-password" required minLength={8}
                                value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending ? "가입 중..." : "가입하기"}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            이미 계정이 있으신가요?{" "}
                            <Link to="/login" className="text-primary hover:underline">
                                로그인
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
