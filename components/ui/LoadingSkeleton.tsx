import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  className?: string;
};

export default function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <div className={cn("skeleton-shimmer rounded-2xl", className)} />;
}
