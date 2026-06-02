import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom"
import { useAuthStore, useIsAdmin } from "@/features/auth/store"
import { RouteFallback } from "@/shared/components/RouteFallback"

// ── 즉시 로드 (entry-level — 첫 진입 경로) ──
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"
import { HomePage } from "@/pages/HomePage"

// ── lazy: 로그인 후 진입 경로 — 라우트 단위 청크 분할 ──
// 모든 페이지가 named export 라 .then() 으로 default 형태에 맞춰준다.
const QuestionsPage         = lazy(() => import("@/pages/QuestionsPage").then(m => ({ default: m.QuestionsPage })))
const QuestionDetailPage    = lazy(() => import("@/pages/QuestionDetailPage").then(m => ({ default: m.QuestionDetailPage })))
const ExamStartPage         = lazy(() => import("@/pages/ExamStartPage").then(m => ({ default: m.ExamStartPage })))
const ExamInProgressPage    = lazy(() => import("@/pages/ExamInProgressPage").then(m => ({ default: m.ExamInProgressPage })))
const ExamResultPage        = lazy(() => import("@/pages/ExamResultPage").then(m => ({ default: m.ExamResultPage })))
const WrongNotesPage        = lazy(() => import("@/pages/WrongNotesPage").then(m => ({ default: m.WrongNotesPage })))
const StatisticsPage        = lazy(() => import("@/pages/StatisticsPage").then(m => ({ default: m.StatisticsPage })))  // recharts 청크 분리
const AdminQuestionsPage    = lazy(() => import("@/pages/AdminQuestionsPage").then(m => ({ default: m.AdminQuestionsPage })))
const AdminQuestionFormPage = lazy(() => import("@/pages/AdminQuestionFormPage").then(m => ({ default: m.AdminQuestionFormPage })))

// 보호된 영역의 Outlet 을 Suspense 로 한 번에 감싼다 — 라우트 전환마다 fallback 노출.
function SuspendedOutlet() {
    return (
        <Suspense fallback={<RouteFallback />}>
            <Outlet />
        </Suspense>
    )
}

function ProtectedRoute() {
    const at = useAuthStore((s) => s.accessToken)
    if (!at) return <Navigate to="/login" replace />
    return <SuspendedOutlet />
}

function GuestRoute() {
    const at = useAuthStore((s) => s.accessToken)
    return !at ? <Outlet /> : <Navigate to="/" replace />
}

/**
 * ADMIN 전용 라우트 가드.
 * JWT 의 role 클레임을 본 후 ADMIN 이 아니면 홈으로 리다이렉트.
 * 신뢰 경계는 백엔드 — 여기는 단지 UI 분기 (토큰 위조하더라도 ADMIN API 호출은 백엔드가 차단).
 */
function AdminRoute() {
    const at = useAuthStore((s) => s.accessToken)
    const isAdmin = useIsAdmin()
    if (!at) return <Navigate to="/login" replace />
    if (!isAdmin) return <Navigate to="/" replace />
    return <SuspendedOutlet />
}

export const router = createBrowserRouter([
    {
        element: <GuestRoute />,
        children: [
            { path: "/login", element: <LoginPage /> },
            { path: "/signup", element: <SignupPage /> },
        ],
    },
    {
        element: <ProtectedRoute />,
        children: [
            { path: "/", element: <HomePage /> },
            { path: "/questions", element: <QuestionsPage /> },
            { path: "/questions/:id", element: <QuestionDetailPage /> },
            { path: "/exams/new", element: <ExamStartPage /> },
            { path: "/exams/:id", element: <ExamInProgressPage /> },
            { path: "/exams/:id/result", element: <ExamResultPage /> },
            { path: "/wrong-notes", element: <WrongNotesPage /> },
            { path: "/statistics", element: <StatisticsPage /> },
        ],
    },
    {
        element: <AdminRoute />,
        children: [
            { path: "/admin/questions", element: <AdminQuestionsPage /> },
            { path: "/admin/questions/new", element: <AdminQuestionFormPage /> },
            { path: "/admin/questions/:id/edit", element: <AdminQuestionFormPage /> },
        ],
    },
])
