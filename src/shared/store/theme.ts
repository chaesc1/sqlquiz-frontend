import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark"

interface ThemeState {
    theme: Theme
    toggle: () => void
    set: (theme: Theme) => void
}

/**
 * 다크/라이트 토글 store. localStorage 에 영속.
 * 첫 방문 시 OS 기본을 따른다 (prefers-color-scheme).
 */
function initialTheme(): Theme {
    if (typeof window === "undefined") return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: initialTheme(),
            toggle: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
            set: (theme) => set({ theme }),
        }),
        { name: "sqlquiz.theme" }
    )
)

/**
 * <html> 에 .dark 클래스를 토글해 Tailwind v4 의 @custom-variant 가 활성화되도록.
 * main.tsx 에서 한 번 호출.
 */
export function applyThemeEffect() {
    const apply = (theme: Theme) =>
        document.documentElement.classList.toggle("dark", theme === "dark")
    apply(useThemeStore.getState().theme)
    useThemeStore.subscribe((state) => apply(state.theme))
}
