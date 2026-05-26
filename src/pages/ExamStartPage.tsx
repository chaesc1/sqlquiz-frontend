import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

import { examApi } from "@/features/exams/api"
import type { Difficulty, ExamType } from "@/features/questions/types"
import { AppHeader } from "@/shared/components/AppHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { ErrorBody } from "@/shared/types/api"

const ANY = "ANY"

/**
 * 시험 시작 페이지.
 *
 * - examType / count(1~50) / difficulty(선택) 입력
 * - POST /api/v1/exams 호출 → 200/201 받으면 /exams/:id 로 이동
 * - 백엔드가 NOT_ENOUGH_QUESTIONS 를 던지면 토스트로 알림
 */
export function ExamStartPage() {
    const navigate = useNavigate()
    const [examType, setExamType] = useState<ExamType>("SQLD")
    const [count, setCount] = useState(10)
    const [difficulty, setDifficulty] = useState<Difficulty | typeof ANY>(ANY)

    const startMut = useMutation({
        mutationFn: () =>
            examApi.start({
                examType,
                count,
                difficulty: difficulty === ANY ? undefined : difficulty,
            }),
        onSuccess: (res) => {
            const id = res.data.data.attemptId
            toast.success("시험이 시작되었습니다.")
            navigate(`/exams/${id}`, { replace: true })
        },
        onError: (err: AxiosError<ErrorBody>) => {
            toast.error(err.response?.data?.message ?? "시험을 시작하지 못했습니다.")
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (count < 1 || count > 50) {
            toast.error("문항 수는 1 ~ 50 사이여야 합니다.")
            return
        }
        startMut.mutate()
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-xl mx-auto px-4 py-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">시험 응시</CardTitle>
                        <CardDescription>
                            아래 조건으로 무작위 문제를 출제합니다. 시작하면 진행 상태가 서버에 저장되어
                            새로고침해도 이어 풀 수 있습니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label>시험 종류</Label>
                                <Select value={examType} onValueChange={(v) => setExamType(v as ExamType)}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SQLD">SQLD</SelectItem>
                                        <SelectItem value="SQLP">SQLP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="count">문항 수 (1 ~ 50)</Label>
                                <Input
                                    id="count"
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>난이도 (선택)</Label>
                                <Select
                                    value={difficulty}
                                    onValueChange={(v) => setDifficulty(v as Difficulty | typeof ANY)}
                                >
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ANY}>전체</SelectItem>
                                        <SelectItem value="EASY">쉬움</SelectItem>
                                        <SelectItem value="MEDIUM">보통</SelectItem>
                                        <SelectItem value="HARD">어려움</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => navigate("/")}>
                                    취소
                                </Button>
                                <Button type="submit" disabled={startMut.isPending}>
                                    {startMut.isPending ? "준비 중..." : "시험 시작"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
