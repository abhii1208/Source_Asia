import { cn } from "@/lib/utils";
import type { BookingStatus, FlightStatus } from "@/lib/types";

type StatusBadgeProps = {
  status: FlightStatus | BookingStatus;
  className?: string;
};

const labelMap: Record<FlightStatus | BookingStatus, string> = {
  scheduled: "Scheduled",
  boarding: "Boarding",
  delayed: "Delayed",
  departed: "Departed",
  landed: "Landed",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled"
};

const classMap: Record<FlightStatus | BookingStatus, string> = {
  scheduled: "bg-surface-container text-primary",
  boarding: "bg-primary-container/20 text-primary",
  delayed: "bg-error-container text-on-error-container",
  departed: "bg-secondary-container text-on-secondary-container",
  landed: "bg-secondary-container text-on-secondary-container",
  confirmed: "bg-primary-container/20 text-primary",
  rescheduled: "bg-surface-container text-on-surface",
  cancelled: "bg-error-container text-on-error-container"
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-label-caps text-label-caps border border-outline-variant/40",
        classMap[status],
        className
      )}
    >
      {labelMap[status]}
    </span>
  );
}
