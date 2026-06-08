"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Bot,
  GraduationCap,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getRolePath } from "@/lib/api";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { FloatingSquares } from "@/components/public/FloatingSquares";

const highlights = [
  { icon: BookOpen, text: "Courses, batches & live classes" },
  { icon: Bot, text: "AI-powered study guidance" },
  { icon: GraduationCap, text: "Typing, shorthand & certificates" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [formFocused, setFormFocused] = useState(false);
  const formCardRef = useRef<HTMLDivElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const scrollFormIntoView = useCallback(() => {
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleFieldFocus = useCallback(() => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setFormFocused(true);
    scrollFormIntoView();
  }, [scrollFormIntoView]);

  const handleFieldBlur = useCallback(() => {
    blurTimerRef.current = setTimeout(() => setFormFocused(false), 120);
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboardInset = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardInset(inset);
    };

    updateKeyboardInset();
    viewport.addEventListener("resize", updateKeyboardInset);
    viewport.addEventListener("scroll", updateKeyboardInset);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardInset);
      viewport.removeEventListener("scroll", updateKeyboardInset);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(email, password);
      router.push(getRolePath(user.role));
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background pt-public-nav text-foreground">
      <PublicNavbar />

      <section className="flex min-h-0 flex-1 w-full flex-col overflow-y-auto md:min-h-[calc(100dvh-var(--public-nav-h))] md:flex-row md:items-stretch md:overflow-visible">
        {/* Left — branding content (hero-style); collapses on mobile when typing */}
        <div
          className={`relative flex w-full flex-col justify-center overflow-hidden bg-background px-6 py-12 sm:px-12 sm:py-16 md:w-1/2 md:px-10 md:py-16 lg:px-16 xl:px-24 ${
            formFocused ? "hidden md:flex" : "flex"
          }`}
        >
          <FloatingSquares />

          <div className="relative z-10 mx-auto w-full max-w-xl md:mx-0">
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full bg-[#facc15]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#ca8a04]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Student &amp; Staff Portal
            </motion.div>

            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-6 text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Welcome to{" "}
              <span className="text-transparent" style={{ WebkitTextStroke: "1.5px #facc15" }}>
                Luv Kush
              </span>
            </motion.h1>

            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-4 inline-block bg-[#facc15] px-4 py-2"
            >
              <p className="text-sm font-bold uppercase tracking-widest text-black">
                Coaching Center
              </p>
            </motion.div>

            <motion.p
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-6 max-w-md text-sm leading-relaxed text-muted sm:text-base"
            >
              Shorthand, typing, computer fundamentals, Tally, and digital literacy —
              built for students, job seekers, and working professionals.
            </motion.p>

            <motion.ul
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-8 space-y-3"
            >
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-foreground">
                  <span className="inline-flex rounded-lg bg-[#facc15]/15 p-2">
                    <Icon className="h-4 w-4 text-[#ca8a04]" />
                  </span>
                  {text}
                </li>
              ))}
            </motion.ul>

            <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}>
              <Link
                href="/"
                className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-foreground"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to home
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Right — login form panel (same bg + animation as content side) */}
        <div
          className="relative flex w-full items-start justify-center overflow-hidden bg-background px-4 py-6 sm:px-6 sm:py-10 md:w-1/2 md:items-center md:px-10 md:py-14 lg:px-16"
          style={{ paddingBottom: keyboardInset > 0 ? keyboardInset + 24 : undefined }}
        >
          <FloatingSquares />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative z-10 w-full max-w-md md:my-0"
          >
            <div ref={formCardRef} className="portrait-3d rounded-2xl border border-default/60 bg-card p-7 sm:p-9">
              <div className="mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
                  Sign In
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Enter your credentials to access your dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="space-y-4"
                >
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                      Email
                    </span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={handleFieldFocus}
                        onBlur={handleFieldBlur}
                        className="input-field w-full rounded-xl border py-3.5 pl-11 pr-4 outline-none transition focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]/20"
                        required
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                      Password
                    </span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={handleFieldFocus}
                        onBlur={handleFieldBlur}
                        className="input-field w-full rounded-xl border py-3.5 pl-11 pr-4 outline-none transition focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]/20"
                        required
                      />
                    </div>
                  </label>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#facc15] py-3.5 text-sm font-bold uppercase tracking-wider text-black shadow-md transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign In"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}