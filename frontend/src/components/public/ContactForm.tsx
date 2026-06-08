"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send, User, Mail, Phone, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { Input, Button } from "@/components/ui/input";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.submitContactInquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim() || undefined,
        message: message.trim(),
      });
      setSubmitted(true);
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-default bg-card p-8 text-center card-shadow">
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">Message sent!</h3>
        <p className="mt-2 text-sm text-muted">
          Thank you for reaching out. Our team will review your inquiry and contact you shortly.
        </p>
        <Button className="mt-5" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-default bg-card p-6 card-shadow sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-primary-light p-2.5">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Send us a message</h3>
          <p className="text-sm text-muted">We typically respond within 1–2 business days.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <User className="h-3.5 w-3.5 text-muted" />
            Full name <span className="text-danger">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            placeholder="Your name"
            className="input-field w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Phone className="h-3.5 w-3.5 text-muted" />
            Phone <span className="text-danger">*</span>
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            maxLength={20}
            placeholder="+91 98765 43210"
            className="input-field w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Mail className="h-3.5 w-3.5 text-muted" />
          Email <span className="text-danger">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={120}
          placeholder="you@example.com"
          className="input-field w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="mt-4">
        <Input
          label="Subject (optional)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Admission inquiry, course details…"
          maxLength={120}
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Message <span className="text-danger">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          maxLength={2000}
          placeholder="Tell us how we can help you…"
          className="input-field w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <p className="mt-1 text-xs text-muted">{message.length}/2000</p>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={loading} className="mt-5 w-full gap-2 py-3">
        <Send className="h-4 w-4" />
        {loading ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}