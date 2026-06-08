import { useActivity } from "../useActivity";
import { describeActivity } from "../activityText";
import { formatTimestamp } from "../format";
import { LoadingState, ErrorState, EmptyState } from "@/components/States";

export function ActivityPanel({ boardId, open }: { boardId: string; open: boolean }) {
  const { data, isLoading, isError, refetch } = useActivity(boardId, open);

  if (isLoading) return <LoadingState label="Loading activity…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data || data.activities.length === 0)
    return <EmptyState title="No activity yet" description="Changes to this board will appear here." />;

  return (
    <ul className="space-y-3">
      {data.activities.map((a) => (
        <li key={a.id} className="flex gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
            {(a.user?.name ?? "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-slate-700">{describeActivity(a)}</p>
            <p className="text-xs text-slate-400">{formatTimestamp(a.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
