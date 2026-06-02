import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

import { categoryApi, questionApi, type QuestionWriteRequest } from "@/features/questions/api"
import type { Difficulty } from "@/features/questions/types"
import { AppHeader } from "@/shared/components/AppHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { ErrorBody } from "@/shared/types/api"
import { cn } from "@/lib/utils"

type Option = 1 | 2 | 3 | 4
const OPTIONS: Option[] = [1, 2, 3, 4]

interface FormState {
    categoryId: number | null
    content: string
    option1: string
    option2: string
    option3: string
    option4: string
    answer: Option | null
    explanation: string
    difficulty: Difficulty | null
}

const initial: FormState = {
    categoryId: null,
    content: "",
    option1: "", option2: "", option3: "", option4: "",
    answer: null,
    explanation: "",
    difficulty: null,
}

/**
 * 문제 등록/수정 폼 (한 컴포넌트가 두 모드 처리).
 *  - /admin/questions/new       → mode=create
 *  - /admin/questions/:id/edit  → mode=edit (기존 값으로 초기화)
 *
 * 백엔드 검증과 동일한 클라이언트 검증을 1차로 수행:
 *  - categoryId, difficulty, answer NotNull
 *  - content, option1~4 NotBlank
 *  - answer 1~4
 */
export function AdminQuestionFormPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const isEdit = Boolean(id)
    const questionId = id ? Number(id) : null

    const [form, setForm] = useState<FormState>(initial)
    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }))

    const categoriesQuery = useQuery({
        queryKey: ["categories", undefined],
        queryFn: async () => (await categoryApi.list()).data.data,
    })

    // edit 모드 — 기존 값 로드
    const detailQuery = useQuery({
        queryKey: ["question", questionId],
        queryFn: async () => (await questionApi.detail(questionId!)).data.data,
        enabled: isEdit && Number.isFinite(questionId),
    })

    useEffect(() => {
        if (!detailQuery.data) return
        const d = detailQuery.data
        setForm({
            categoryId: d.categoryId,
            content: d.content,
            option1: d.option1, option2: d.option2, option3: d.option3, option4: d.option4,
            answer: d.answer as Option,
            explanation: d.explanation ?? "",
            difficulty: d.difficulty,
        })
    }, [detailQuery.data])

    const validate = (): string | null => {
        if (!form.categoryId) return "카테고리를 선택해주세요."
        if (!form.content.trim()) return "문제 지문을 입력해주세요."
        if (!form.option1.trim() || !form.option2.trim() || !form.option3.trim() || !form.option4.trim())
            return "보기 1~4 를 모두 입력해주세요."
        if (!form.answer || form.answer < 1 || form.answer > 4) return "정답을 선택해주세요."
        if (!form.difficulty) return "난이도를 선택해주세요."
        return null
    }

    const buildBody = (): QuestionWriteRequest => ({
        categoryId: form.categoryId!,
        content: form.content.trim(),
        option1: form.option1.trim(),
        option2: form.option2.trim(),
        option3: form.option3.trim(),
        option4: form.option4.trim(),
        answer: form.answer!,
        explanation: form.explanation.trim() || null,
        difficulty: form.difficulty!,
    })

    const mutation = useMutation({
        mutationFn: async () => {
            // create/update 응답 타입(number vs null)이 달라 union 으로 묶이면
            // useMutation 의 result generic 추론이 깨진다. 결과를 안 쓰니 void 로 통일.
            if (isEdit) await questionApi.update(questionId!, buildBody())
            else await questionApi.create(buildBody())
        },
        onSuccess: () => {
            toast.success(isEdit ? "문제가 수정되었습니다." : "문제가 등록되었습니다.")
            queryClient.invalidateQueries({ queryKey: ["admin-questions"] })
            queryClient.invalidateQueries({ queryKey: ["questions"] })
            if (isEdit) queryClient.invalidateQueries({ queryKey: ["question", questionId] })
            navigate("/admin/questions")
        },
        onError: (err: AxiosError<ErrorBody>) => {
            toast.error(err.response?.data?.message ?? "저장에 실패했습니다.")
        },
    })

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        const msg = validate()
        if (msg) { toast.error(msg); return }
        mutation.mutate()
    }

    if (isEdit && detailQuery.isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader />
                <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-96" />
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="max-w-2xl mx-auto px-4 py-6">
                <Link to="/admin/questions"
                    className="inline-block mb-4 text-sm text-muted-foreground hover:text-foreground">
                    ← 목록으로
                </Link>

                <Card>
                    <CardHeader>
                        <CardTitle>{isEdit ? `문제 #${questionId} 수정` : "새 문제 등록"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-5">
                            <Field label="카테고리">
                                <Select
                                    value={form.categoryId ? String(form.categoryId) : ""}
                                    onValueChange={(v) => set("categoryId", Number(v))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="카테고리 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(categoriesQuery.data ?? []).map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                [{c.examType}] {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field label="문제 지문">
                                <Textarea rows={3} value={form.content}
                                    onChange={(e) => set("content", e.target.value)}
                                    placeholder="문제 본문을 입력하세요" />
                            </Field>

                            <div className="space-y-2">
                                <span className="text-sm font-medium">보기 (정답에 체크)</span>
                                {OPTIONS.map((n) => {
                                    const key = `option${n}` as const
                                    const isAnswer = form.answer === n
                                    return (
                                        <div key={n} className="flex items-start gap-2">
                                            <button type="button"
                                                onClick={() => set("answer", n)}
                                                className={cn(
                                                    "shrink-0 mt-1 h-6 w-6 rounded-md border text-xs font-bold flex items-center justify-center transition-colors",
                                                    isAnswer
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-input text-muted-foreground hover:bg-secondary"
                                                )}
                                                aria-label={`보기 ${n} 을 정답으로 선택`}>
                                                {n}
                                            </button>
                                            <Input className="h-9" value={form[key]}
                                                onChange={(e) => set(key, e.target.value)}
                                                placeholder={`보기 ${n}`} />
                                        </div>
                                    )
                                })}
                                {form.answer && (
                                    <p className="text-xs text-muted-foreground">현재 정답: {form.answer}번</p>
                                )}
                            </div>

                            <Field label="해설 (선택)">
                                <Textarea rows={3} value={form.explanation}
                                    onChange={(e) => set("explanation", e.target.value)}
                                    placeholder="정답 근거 / 오답이 왜 틀린지" />
                            </Field>

                            <Field label="난이도">
                                <Select
                                    value={form.difficulty ?? ""}
                                    onValueChange={(v) => set("difficulty", v as Difficulty)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="난이도 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EASY">쉬움 (EASY)</SelectItem>
                                        <SelectItem value="MEDIUM">보통 (MEDIUM)</SelectItem>
                                        <SelectItem value="HARD">어려움 (HARD)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost"
                                    onClick={() => navigate("/admin/questions")}>
                                    취소
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending
                                        ? (isEdit ? "저장 중..." : "등록 중...")
                                        : (isEdit ? "수정 저장" : "등록")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm">{label}</Label>
            {children}
        </div>
    )
}
