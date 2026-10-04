import type { ReactNode, Ref } from "react";

import { Card } from "./card";

type CustomerStatePanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  actions?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
  announce?: boolean;
};

export function CustomerStatePanel({
  eyebrow,
  title,
  description,
  icon,
  actions,
  headingRef,
  announce = false,
}: CustomerStatePanelProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-16rem)] w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <Card
        role={announce ? "alert" : undefined}
        className="w-full rounded-3xl px-6 py-14 text-center sm:px-10 sm:py-20"
      >
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-xl font-bold text-[var(--color-brand-text)]">
          {icon}
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand-text)]">
          {eyebrow}
        </p>
        <h1
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl"
        >
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
          {description}
        </p>
        {actions ? (
          <div className="mx-auto mt-7 flex max-w-md flex-col justify-center gap-3 sm:flex-row">
            {actions}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
