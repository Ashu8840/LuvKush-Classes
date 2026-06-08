import { Quote, Star } from "lucide-react";
import type { PublicTestimonial } from "@/lib/api";

function StudentAvatar({ name, avatar }: { name: string; avatar?: string }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-primary/30 bg-primary-light">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary">
          {initials}
        </div>
      )}
    </div>
  );
}

const CARD_HEIGHT = "h-[280px]";

export function TestimonialCard({ item }: { item: PublicTestimonial }) {
  return (
    <article
      className={`group relative flex ${CARD_HEIGHT} flex-col overflow-hidden rounded-2xl border border-default bg-card p-6 card-shadow transition hover:-translate-y-1 hover:border-primary/40`}
    >
      <Quote className="absolute right-5 top-5 h-8 w-8 text-primary/15 transition group-hover:text-primary/25" />
      <div className="mb-4 flex shrink-0 gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < item.rating ? "fill-amber-400 text-amber-400" : "text-muted/40"}`}
          />
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <p className="text-sm leading-relaxed text-foreground">&ldquo;{item.message}&rdquo;</p>
      </div>
      <div className="mt-4 flex shrink-0 items-center gap-3 border-t border-default/60 pt-4">
        <StudentAvatar name={item.student.name} avatar={item.student.avatar} />
        <div>
          <p className="text-sm font-semibold text-foreground">{item.student.name}</p>
          <p className="text-xs text-muted">Student</p>
        </div>
      </div>
    </article>
  );
}