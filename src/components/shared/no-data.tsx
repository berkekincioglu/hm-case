import { Database } from "lucide-react";

interface NoDataProps {
  message?: string;
}

export function NoData({ message = "No data available" }: NoDataProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Database className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Try adjusting your filters
      </p>
    </div>
  );
}
