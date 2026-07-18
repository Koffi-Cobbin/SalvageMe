import { clsx } from "clsx";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl2 border border-paper-300 bg-white shadow-card transition-shadow hover:shadow-cardHover",
        className,
      )}
      {...props}
    />
  );
}
