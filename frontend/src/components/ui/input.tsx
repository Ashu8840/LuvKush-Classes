import { cn } from "@/lib/utils";

export function Input({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <input
        className={cn(
          "input-field w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function Select({
  label,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <select
        className={cn(
          "input-field w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" }) {
  return (
    <button
      className={cn(
        "rounded-xl px-5 py-2.5 text-sm font-medium transition disabled:opacity-60",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "border border-default text-foreground hover:bg-primary-light",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}