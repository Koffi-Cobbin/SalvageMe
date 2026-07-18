import { clsx } from "clsx";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl2 border border-paper-300 bg-white transition-shadow",
        "[box-shadow:0_2px_10px_rgba(29,26,21,0.06)] hover:[box-shadow:0_6px_20px_rgba(29,26,21,0.10)]",
        className,
      )}
      {...props}
    />
  );
}
