"use client";

import { FormEvent, useState } from "react";
import { MessageSquareHeart, Shield, Star, CheckCircle2, Quote } from "lucide-react";
import { api, FeedbackCategory } from "@/lib/api";
import { FEEDBACK_CATEGORIES } from "@/lib/feedback";
import { Card } from "@/components/ui/card";
import { Input, Select, Button } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "feedback" | "testimonial";

export default function StudentFeedbackPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("feedback");
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [rating, setRating] = useState(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please write your message before submitting.");
      return;
    }
    if (mode === "testimonial" && rating < 1) {
      setError("Please select a star rating for your testimonial.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.submitFeedback({
        category,
        rating: rating || undefined,
        subject: subject.trim() || undefined,
        message: message.trim(),
        isTestimonial: mode === "testimonial",
      });
      setSubmitted(true);
      setCategory("general");
      setRating(0);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
          <h2 className="mt-4 text-xl font-bold text-foreground">Thank you!</h2>
          <p className="mt-2 text-sm text-muted">
            {mode === "testimonial"
              ? "Your testimonial was submitted. If approved by admin, it may appear on our website homepage."
              : "Your feedback was submitted anonymously. The admin team will review it to improve the institute."}
          </p>
          <Button className="mt-6" onClick={() => setSubmitted(false)}>
            Submit another response
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex rounded-xl border border-default bg-card p-1">
        <button
          type="button"
          onClick={() => setMode("feedback")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            mode === "feedback" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          <Shield className="h-4 w-4" />
          Anonymous Feedback
        </button>
        <button
          type="button"
          onClick={() => setMode("testimonial")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            mode === "testimonial" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          <Quote className="h-4 w-4" />
          Testimonial
        </button>
      </div>

      <Card className={mode === "feedback" ? "border-accent/20 bg-primary-light/30" : "border-primary/20 bg-primary-light/20"}>
        <div className="flex gap-4">
          <div className="rounded-xl bg-primary-light p-3 text-primary">
            {mode === "feedback" ? <Shield className="h-6 w-6" /> : <Quote className="h-6 w-6" />}
          </div>
          <div>
            <h2 className="font-semibold text-foreground">
              {mode === "feedback" ? "Anonymous Feedback" : "Share a Testimonial"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {mode === "feedback" ? (
                <>
                  Share honest suggestions about courses, teachers, facilities, fees, or the app.
                  Your name and identity are <strong>never shown</strong> to admin.
                </>
              ) : (
                <>
                  Share your learning experience publicly. Your name
                  {user?.avatar ? ", profile photo," : ""} and star rating will be visible to admin.
                  If approved, your testimonial may appear on the website homepage.
                </>
              )}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2 text-foreground">
            <MessageSquareHeart className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">
              {mode === "feedback" ? "Share your experience" : "Write your testimonial"}
            </h3>
          </div>

          {mode === "feedback" && (
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            >
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Star rating {mode === "feedback" && <span className="text-muted">(optional)</span>}
              {mode === "testimonial" && <span className="text-danger"> *</span>}
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n === rating ? 0 : n)}
                  className="rounded-lg p-1 transition hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {mode === "feedback" && (
            <Input
              label="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Typing lab timings, exam schedule…"
              maxLength={120}
            />
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {mode === "feedback" ? "Your feedback" : "Your testimonial"}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              maxLength={2000}
              placeholder={
                mode === "feedback"
                  ? "Tell us what is working well and what we should improve…"
                  : "Describe how this institute helped you learn and grow…"
              }
              className="input-field w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <p className="mt-1 text-xs text-muted">{message.length}/2000</p>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading
              ? "Submitting…"
              : mode === "feedback"
                ? "Submit Anonymous Feedback"
                : "Submit Testimonial"}
          </Button>
        </form>
      </Card>
    </div>
  );
}