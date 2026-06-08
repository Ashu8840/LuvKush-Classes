export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-default">
      <table className="w-full text-left text-sm text-foreground">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="table-head">{children}</thead>;
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-6 py-4 font-medium text-foreground">{children}</th>;
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-4 text-foreground ${className || ""}`}>{children}</td>;
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="border-t border-default">{children}</tr>;
}