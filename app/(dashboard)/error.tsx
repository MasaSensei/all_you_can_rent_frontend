"use client";
import { PageError } from "@/components/common/ErrorBoundary";
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <PageError error={error} reset={reset} />
    </div>
  );
}
