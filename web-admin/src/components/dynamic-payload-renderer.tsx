import { Badge } from "@/components/ui/badge"

interface DynamicPayloadRendererProps {
  requestType: string;
  details: Record<string, any>;
}

export function DynamicPayloadRenderer({ requestType, details }: DynamicPayloadRendererProps) {
  if (!details || Object.keys(details).length === 0) {
    return <div className="text-muted-foreground text-sm">No additional details provided.</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md border border-border/50">
      {Object.entries(details).map(([key, value]) => (
        <div key={key} className="flex flex-col">
          <span className="text-xs uppercase text-muted-foreground font-semibold mb-1">
            {key.replace(/_/g, ' ')}
          </span>
          <span className="text-sm font-medium">
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
          </span>
        </div>
      ))}
    </div>
  )
}
