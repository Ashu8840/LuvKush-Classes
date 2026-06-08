"use client";

type Props = {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({ page, pages, onPageChange, className = "" }: Props) {
  if (pages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="text-sm font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-muted">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        className="text-sm font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}