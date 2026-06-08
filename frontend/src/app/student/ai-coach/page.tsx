"use client";

import { FormEvent, useState } from "react";
import { Bot, Send } from "lucide-react";
import { api } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your AI coach at Luv Kush Classes. Ask me about typing, shorthand, exams, or study plans!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const data = await api.askCoach(question);
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-primary-light p-3">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">AI Coach</h3>
          <p className="text-sm text-muted">Powered by Groq AI</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-default bg-card p-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary-light text-foreground"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-muted">Thinking...</p>}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about typing, shorthand, or study tips..."
          className="input-field flex-1 rounded-xl border px-4 py-3 outline-none focus:border-primary"
        />
        <button type="submit" disabled={loading} className="rounded-xl bg-primary px-4 py-3 text-primary-foreground hover:opacity-90 disabled:opacity-60">
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}