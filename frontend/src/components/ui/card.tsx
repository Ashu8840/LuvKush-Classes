import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-default bg-card p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {trend && <p className="mt-1 text-xs text-accent">{trend}</p>}
        </div>
        <div className="rounded-xl bg-primary-light p-3 text-primary">{icon}</div>
      </div>
    </Card>
  );
}