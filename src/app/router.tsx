import { createBrowserRouter, Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
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

function ProtectedRoute() {
    const at = useAuthStore((s) => s.accessToken)
    return at ? <Outlet /> : <Navigate to="/login" replace />
}

function GuestRoute() {
    const at = useAuthStore((s) => s.accessToken)
    return !at ? <Outlet /> : <Navigate to="/" replace />
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
])
