import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  className?: string;
};

export default function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <div className={cn("animate-pulse rounded-2xl bg-surface-container-high/80", className)} />;
}

