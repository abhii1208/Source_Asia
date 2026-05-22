"use client";

import { cn } from "@/lib/utils";

type PrintTicketButtonProps = {
  className?: string;
  label?: string;
  ticketSelector?: string;
};

function cleanupPrintSelection(target: Element | null) {
  document.body.classList.remove("printing-ticket");
  if (target) {
    target.classList.remove("print-selected-ticket");
  }
}

export default function PrintTicketButton({
  className,
  label = "Print Ticket",
  ticketSelector
}: PrintTicketButtonProps) {
  function printTicket() {
    if (typeof window === "undefined") {
      return;
    }

    const target = ticketSelector ? document.querySelector(ticketSelector) : null;
    if (target) {
      document.body.classList.add("printing-ticket");
      target.classList.add("print-selected-ticket");

      const cleanup = () => cleanupPrintSelection(target);
      window.addEventListener("afterprint", cleanup, { once: true });
      window.setTimeout(cleanup, 1200);
    }

    window.print();
  }

  return (
    <button
      type="button"
      onClick={printTicket}
      className={cn(
        "rounded-xl border border-outline text-on-surface px-5 py-3 hover:bg-surface-container-low transition-colors focus-ring no-print",
        className
      )}
    >
      {label}
    </button>
  );
}
