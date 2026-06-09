"use client";

import Link from "next/link";
import { useState, type PointerEvent } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeSelector } from "@/components/layout/ThemeSelector";

const NAV_LINKS = [
  { href: "/#home", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#contact", label: "Contact" },
];

function NavLink({
  href,
  label,
  menu = false,
  onNavigate,
}: {
  href: string;
  label: string;
  menu?: boolean;
  onNavigate?: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  const clearPressed = () => setPressed(false);

  const handlePointerDown = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setPressed(true);
  };

  const handleClick = () => {
    if (onNavigate) {
      window.setTimeout(onNavigate, 140);
    }
  };

  return (
    <Link
      href={href}
      className={`nav-link-glass text-base ${menu ? "nav-link-glass--menu" : ""} ${
        pressed ? "nav-link-glass--active" : ""
      }`}
      onPointerDown={handlePointerDown}
      onPointerUp={clearPressed}
      onPointerLeave={clearPressed}
      onPointerCancel={clearPressed}
      onClick={handleClick}
    >
      {label}
    </Link>
  );
}

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

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

        <div className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
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
            className="rounded-lg p-1.5 text-foreground sm:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-default px-4 py-2 sm:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                menu
                onNavigate={closeMenu}
              />
            ))}
            <Link
              href="/login"
              onClick={() => window.setTimeout(closeMenu, 140)}
              className="mt-1.5 rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}