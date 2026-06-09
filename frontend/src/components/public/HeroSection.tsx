"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingSquares } from "@/components/public/FloatingSquares";
import { scrollToPublicSection } from "@/lib/public-scroll";

const TypewriterText = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <motion.span
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      }}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};

export function HeroSection() {
  return (
    <section
      id="home"
      className="scroll-mt-24 flex min-h-[calc(100dvh-94px)] w-full flex-col md:flex-row md:items-stretch"
    >
      {/* Left — hero copy */}
      <div className="relative flex w-full flex-col justify-center overflow-hidden bg-background px-6 py-12 sm:px-12 sm:py-16 md:w-1/2 md:px-10 lg:px-16 xl:px-24">
        <FloatingSquares />

        <div className="relative z-10 mx-auto w-full max-w-xl md:mx-0 md:-translate-y-4 lg:-translate-y-8">
          <p className="mb-2 text-lg font-black uppercase tracking-widest text-foreground sm:text-2xl md:text-xl lg:text-3xl">
            <TypewriterText text="Luv Kush Coaching Center" />
          </p>

          <h1 className="mt-2 text-5xl font-black uppercase leading-[1.1] text-foreground sm:text-6xl md:text-5xl lg:text-7xl xl:text-8xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="inline-block"
            >
              Learn{" "}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="inline-block text-transparent"
              style={{ WebkitTextStroke: "2px #facc15" }}
            >
              Skills That
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="mt-4 inline-block bg-[#facc15] px-4 py-2"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-black sm:text-base">
              Build Your Future
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="mt-6 max-w-md text-sm leading-relaxed text-muted sm:text-[15px] md:mt-8 lg:text-base"
          >
            Shorthand, typing, computer fundamentals, Tally, and digital
            literacy — built for students, job seekers, and working
            professionals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
            className="mt-8 flex flex-wrap gap-3 sm:gap-4 lg:mt-10"
          >
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-[#facc15] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-yellow-500 hover:opacity-90 active:scale-[0.985] sm:px-8 sm:py-3.5 sm:text-sm"
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                scrollToPublicSection("about");
              }}
              className="inline-flex items-center justify-center rounded-full border border-transparent px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted transition hover:border-[#facc15] hover:text-foreground active:scale-[0.985] sm:px-8 sm:py-3.5 sm:text-sm"
            >
              Meet the Instructor
            </a>
          </motion.div>
        </div>
      </div>

      {/* Right — portrait panel (same bg + animation as content side) */}
      <div className="relative flex w-full shrink-0 items-center justify-center overflow-hidden bg-background px-4 py-8 sm:px-6 sm:py-10 md:w-1/2 md:items-stretch md:px-8 md:py-12 lg:px-10 lg:py-16">
        <FloatingSquares />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="portrait-3d relative z-10 aspect-[3/4] w-full max-w-[340px] overflow-hidden rounded-2xl sm:max-w-[400px] md:max-w-none md:aspect-auto md:min-h-[420px] md:flex-1 lg:min-h-0"
        >
          <Image
            src="/owner.png"
            alt="LuvKush Tiwari — Computer Instructor and Tally Trainer"
            fill
            priority
            sizes="(max-width: 640px) 340px, (max-width: 768px) 400px, 50vw"
            className="object-cover object-[center_15%]"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/10 via-transparent to-transparent"
            aria-hidden
          />
        </motion.div>
      </div>
    </section>
  );
}