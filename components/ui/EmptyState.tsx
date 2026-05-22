import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export default function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="glass-panel rounded-2xl p-8 text-center shadow-glass">
      <div className="w-14 h-14 rounded-full bg-primary-container/20 text-primary mx-auto flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl">flight</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant mt-2">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex mt-5 px-5 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

