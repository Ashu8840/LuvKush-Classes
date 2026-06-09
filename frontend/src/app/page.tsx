import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Award,
  GraduationCap,
  Keyboard,
  Mic,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import * as motion from "framer-motion/client";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { HeroSection } from "@/components/public/HeroSection";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { ContactForm } from "@/components/public/ContactForm";
import { MobileAppDownload } from "@/components/public/MobileAppDownload";
import { HomePageInit } from "@/components/public/HomePageInit";

const EXPERTISE = [
  "Computer Fundamentals & History of Computers",
  "Operating Systems (Windows)",
  "Computer Hardware & Software",
  "Input & Output Devices",
  "Internet & Digital Literacy",
  "MS Office (Word, Excel, PowerPoint)",
  "Tally Prime & Accounting Fundamentals",
  "Online Ticket Booking & E-Services",
  "Social Media & Digital Platforms",
  "Basic Troubleshooting & Practical Computer Applications",
];

const FEATURES = [
  {
    icon: Keyboard,
    title: "Typing Practice",
    desc: "Hindi & English typing with WPM tracking, accuracy analysis, and leaderboards.",
  },
  {
    icon: Mic,
    title: "Shorthand Dictation",
    desc: "Audio dictation at 80, 100, 120, and 140 WPM speeds with evaluation.",
  },
  {
    icon: BookOpen,
    title: "Complete Coaching",
    desc: "Courses, batches, exams, certificates, and AI-powered study plans.",
  },
  {
    icon: Bot,
    title: "AI Study Coach",
    desc: "Personalized guidance, doubt solving, and practice recommendations.",
  },
  {
    icon: Award,
    title: "Certificates",
    desc: "Verified digital certificates for course completion and exam achievements.",
  },
  {
    icon: GraduationCap,
    title: "Live Classes",
    desc: "Interactive online sessions with attendance, chat, and screen sharing.",
  },
];

export default function Home() {
  const floatingSquares = [
    { size: 40, left: "10%", duration: 12, delay: 0 },
    { size: 80, left: "25%", duration: 15, delay: 2 },
    { size: 30, left: "55%", duration: 10, delay: 4 },
    { size: 60, left: "75%", duration: 18, delay: 1 },
    { size: 50, left: "90%", duration: 14, delay: 3 },
    { size: 70, left: "40%", duration: 16, delay: 5 },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background pt-public-nav text-foreground">
      <HomePageInit />
      <PublicNavbar />

      <HeroSection />

      <MobileAppDownload />

      <section
        id="about"
        className="relative flex flex-col justify-center scroll-mt-24 border-y border-default bg-surface py-16 md:py-20 min-h-[calc(100vh-80px)]"
      >
        <div className="mx-auto w-full max-w-6xl grid items-center gap-12 px-4 sm:px-8 lg:px-12 md:grid-cols-5 z-10">
          <div className="md:col-span-2">
            <p className="text-sm sm:text-base font-bold uppercase tracking-widest text-accent">
              About
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-foreground uppercase tracking-tight">
              Hi, I&apos;m Lavkush
            </h2>
            <p className="mt-2 text-xl font-bold text-muted">LuvKush Tiwari</p>
            <p className="mt-5 text-base sm:text-lg text-muted">
              Computer Instructor &amp; Tally Trainer dedicated to helping
              students build strong digital and accounting skills.
            </p>
            <blockquote className="mt-6 border-l-4 border-primary pl-4 text-lg font-semibold italic text-foreground">
              &ldquo;Learn Skills That Build Your Future.&rdquo;
            </blockquote>
          </div>

          <div className="md:col-span-3">
            <p className="text-sm sm:text-base leading-relaxed text-muted lg:text-lg">
              With hands-on teaching experience, I focus on practical learning
              that prepares students for real-world office, business, and
              professional environments. My goal is to make technology simple,
              understandable, and useful for everyone — from beginners to job
              seekers and business professionals.
            </p>
            <h3 className="mt-8 text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">
              My Expertise Includes
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {EXPERTISE.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm sm:text-base font-medium text-foreground"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#facc15]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full px-4 py-20 sm:px-8 lg:px-12 bg-background overflow-hidden min-h-[calc(100vh-80px)] flex flex-col justify-center">
        {/* Background Floating Squares */}
        <div className="absolute inset-0 pointer-events-none">
          {floatingSquares.map((sq, i) => (
            <motion.div
              key={i}
              className="absolute bottom-[-100px] border-2 border-[#facc15]/20 bg-[#facc15]/5 backdrop-blur-sm"
              style={{
                width: sq.size,
                height: sq.size,
                left: sq.left,
                borderRadius: "15%",
              }}
              animate={{
                y: [0, -1200],
                rotate: [0, 360],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: sq.duration,
                repeat: Infinity,
                delay: sq.delay,
                ease: "linear",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-6xl w-full">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
              Platform Features
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted font-medium">
              Everything you need to master shorthand, typing, and professional
              computer skills.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-3xl border border-default/50 bg-surface p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#facc15]/50 hover:shadow-[#facc15]/10"
              >
                <div className="inline-flex rounded-2xl bg-[#facc15]/20 p-4">
                  <Icon className="h-8 w-8 text-[#eab308]" />
                </div>
                <h3 className="mt-6 text-xl font-bold uppercase tracking-wide text-foreground">
                  {title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section
        id="contact"
        className="scroll-mt-24 border-t border-default bg-surface py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Contact
            </h2>
            <p className="mt-3 text-muted">
              Have questions about courses, batches, or admissions? Send us a
              message and we&apos;ll get back to you.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-5 lg:gap-12">
            <div className="space-y-4 lg:col-span-2">
              {[
                {
                  icon: MapPin,
                  label: "Location",
                  value: "Luv Kush Coaching Center",
                },
                {
                  icon: Phone,
                  label: "Phone",
                  value: "Contact institute for details",
                },
                {
                  icon: Mail,
                  label: "Email",
                  value: "info@luvkushclasses.com",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-2xl border border-default bg-card p-5 card-shadow"
                >
                  <div className="inline-flex rounded-full bg-primary-light p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {label}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{value}</p>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-primary/20 bg-primary-light/40 p-5">
                <p className="text-sm font-medium text-foreground">
                  Ready to enroll?
                </p>
                <p className="mt-1 text-sm text-muted">
                  Sign in to access courses, live classes, and your dashboard.
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Enroll Now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-3">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-default bg-background py-8 text-center text-sm text-muted">
        <p>
          © 2026 Luv Kush Coaching Center. Shorthand, Typing &amp; Computer
          Training Institute.
        </p>
      </footer>
    </div>
  );
}
