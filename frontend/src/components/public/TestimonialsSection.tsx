"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { api, PublicTestimonial } from "@/lib/api";
import { TestimonialCard } from "./TestimonialCard";
import { Skeleton } from "@/components/ui/skeleton";

export function TestimonialsSection() {
  const [items, setItems] = useState<PublicTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    api
      .getPublicTestimonials()
      .then((data) => setItems(data.testimonials))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const visible = items.length <= 3 ? items.length : 3;
  const maxIndex = Math.max(0, items.length - visible);

  useEffect(() => {
    if (index > maxIndex) setIndex(maxIndex);
  }, [index, maxIndex]);

  return (
    <section id="testimonials" className="scroll-mt-24 bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            Student Voices
          </div>
          <h2 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">What Our Students Say</h2>
          <p className="mt-3 text-muted">
            Real experiences from learners who trained with Luv Kush Coaching Center.
          </p>
        </div>

        {loading ? (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[280px] rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-default bg-card py-16 text-center">
            <p className="text-muted">Testimonials will appear here once approved by admin.</p>
          </div>
        ) : (
          <div className="relative mt-12">
            <div className="grid items-stretch gap-6 md:grid-cols-3">
              {items.slice(index, index + visible).map((item) => (
                <TestimonialCard key={item._id} item={item} />
              ))}
            </div>
            {items.length > 3 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index <= 0}
                  className="rounded-full border border-default bg-card p-2.5 transition hover:bg-surface disabled:opacity-40"
                  aria-label="Previous testimonials"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-1.5">
                  {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`h-2 rounded-full transition ${i === index ? "w-6 bg-primary" : "w-2 bg-muted/40"}`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
                  disabled={index >= maxIndex}
                  className="rounded-full border border-default bg-card p-2.5 transition hover:bg-surface disabled:opacity-40"
                  aria-label="Next testimonials"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}