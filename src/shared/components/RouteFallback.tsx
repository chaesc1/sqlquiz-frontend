/**
 * 라우트 청크 로딩 중 보여줄 fallback.
 * Suspense 가 첫 마운트나 lazy import 직후만 잠깐 띄우므로 최소한으로.
 */
export function RouteFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-sm text-muted-foreground animate-pulse">로딩 중…</div>
        </div>
    )
}
