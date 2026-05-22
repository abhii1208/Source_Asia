import { cn } from "@/lib/utils";

const steps = ["Search", "Flight", "Passenger", "Seat", "Confirm"];

type BookingStepperProps = {
  activeStep: number;
};

export default function BookingStepper({ activeStep }: BookingStepperProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-gutter py-8">
      <ol className="grid grid-cols-5 items-center gap-3">
        {steps.map((step, idx) => {
          const done = idx < activeStep;
          const active = idx === activeStep;
          return (
            <li key={step} className="flex flex-col items-center gap-2 text-center">
              <div className="w-full flex items-center">
                {idx > 0 ? (
                  <span
                    className={cn(
                      "h-px flex-1",
                      done || active ? "bg-primary/70" : "bg-outline-variant/50"
                    )}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}

                <span
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-mono-data font-mono-data border",
                    done
                      ? "bg-primary text-on-primary border-primary"
                      : active
                        ? "bg-primary-container text-on-primary-container border-primary-container"
                        : "bg-surface-container text-on-surface-variant border-outline-variant/40"
                  )}
                >
                  {done ? <span className="material-symbols-outlined text-[18px]">check</span> : idx + 1}
                </span>

                {idx < steps.length - 1 ? (
                  <span
                    className={cn(
                      "h-px flex-1",
                      done ? "bg-primary/70" : "bg-outline-variant/50"
                    )}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
              </div>
              <span className={cn("text-body-md", active ? "text-on-surface font-semibold" : "text-on-surface-variant")}>
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

