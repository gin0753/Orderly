type OrderlyLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClassName = {
  sm: {
    text: "text-xl",
    dot: "h-1.5 w-1.5",
  },
  md: {
    text: "text-2xl",
    dot: "h-1.5 w-1.5",
  },
  lg: {
    text: "text-3xl",
    dot: "h-2 w-2",
  },
};

export function OrderlyLogo({ size = "md", className }: OrderlyLogoProps) {
  const config = sizeClassName[size];

  return (
    <span
      className={[
        "inline-flex items-baseline gap-1 font-extrabold tracking-tight text-[var(--color-text-primary)]",
        config.text,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span>Orderly</span>
      <span
        className={[
          "inline-block rounded-full bg-[var(--color-brand)]",
          config.dot,
        ].join(" ")}
        aria-hidden="true"
      />
    </span>
  );
}
