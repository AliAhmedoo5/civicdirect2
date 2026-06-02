export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/50 shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            Configure system-wide settings, platform fees, and API keys.
          </p>
        </div>
      </div>
    </div>
  )
}
