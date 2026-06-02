import { createBrowserRouter, Navigate, Outlet } from "react-router-dom"
import { useAuthStore, useIsAdmin } from "@/features/auth/store"
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"
import { HomePage } from "@/pages/HomePage"
import { QuestionsPage } from "@/pages/QuestionsPage"
import { QuestionDetailPage } from "@/pages/QuestionDetailPage"
import { ExamStartPage } from "@/pages/ExamStartPage"
import { ExamInProgressPage } from "@/pages/ExamInProgressPage"
import { ExamResultPage } from "@/pages/ExamResultPage"
import { WrongNotesPage } from "@/pages/WrongNotesPage"
import { StatisticsPage } from "@/pages/StatisticsPage"
import { AdminQuestionsPage } from "@/pages/AdminQuestionsPage"
import { AdminQuestionFormPage } from "@/pages/AdminQuestionFormPage"

function ProtectedRoute() {
    const at = useAuthStore((s) => s.accessToken)
    return at ? <Outlet /> : <Navigate to="/login" replace />
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
    return <Outlet />
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
