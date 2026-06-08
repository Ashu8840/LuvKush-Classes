"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeSelector } from "@/components/layout/ThemeSelector";

const NAV_LINKS = [
  { href: "/#home", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#contact", label: "Contact Us" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-default bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pb-2 pt-[5px] sm:px-6 sm:pb-2.5">
        <Link
          href="/"
          className="flex h-[80px] shrink-0 overflow-hidden"
          aria-label="Home"
        >
          <BrandLogo
            size="md"
            framed
            compact
            priority
            className="translate-y-[20px] [&_img]:!translate-y-0"
          />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-bold text-muted transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="relative z-[60] flex items-center gap-2 sm:gap-3">
          <ThemeSelector elevated />
          <Link
            href="/login"
            className="hidden rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:inline-flex"
          >
            Login
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-1.5 text-foreground md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-default px-4 py-2 md:hidden">
          <div className="flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-base font-bold text-foreground transition hover:bg-surface"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-1.5 rounded-full bg-primary px-5 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
