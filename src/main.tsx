import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import "./index.css"
import { Providers } from "@/app/providers"
import { router } from "@/app/router"
import { applyThemeEffect } from "@/shared/store/theme"

// <html> 에 .dark 클래스를 토글해 Tailwind dark variant 활성화
applyThemeEffect()

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Providers>
            <RouterProvider router={router} />
        </Providers>
    </StrictMode>
)
