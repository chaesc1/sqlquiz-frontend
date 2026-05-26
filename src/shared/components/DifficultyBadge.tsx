import { Badge } from "@/components/ui/badge"
import type { Difficulty } from "@/features/questions/types"

const LABEL: Record<Difficulty, string> = {
    EASY: "쉬움",
    MEDIUM: "보통",
    HARD: "어려움",
}

const VARIANT: Record<Difficulty, "secondary" | "default" | "destructive"> = {
    EASY: "secondary",
    MEDIUM: "default",
    HARD: "destructive",
}

export function DifficultyBadge({ value }: { value: Difficulty }) {
    return <Badge variant={VARIANT[value]}>{LABEL[value]}</Badge>
}
