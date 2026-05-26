import { createBrowserRouter, Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"
import { HomePage } from "@/pages/HomePage"

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
        ],
    },
])
