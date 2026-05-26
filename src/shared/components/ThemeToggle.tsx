import { Button } from "@/components/ui/button"
import { useThemeStore } from "@/shared/store/theme"

export function ThemeToggle() {
    const theme = useThemeStore((s) => s.theme)
    const toggle = useThemeStore((s) => s.toggle)
    return (
        <Button variant="ghost" size="sm" onClick={toggle} aria-label="테마 전환">
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </Button>
    )
}
