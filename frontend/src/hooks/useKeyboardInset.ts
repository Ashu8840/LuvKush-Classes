"use client";

import { useCallback, useEffect, useState } from "react";

/** Tracks mobile/virtual keyboard overlap using Visual Viewport API (web). */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const next = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setInset(next);
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  /** Scroll element so it sits just above the keyboard (WhatsApp-style). */
  const scrollAboveKeyboard = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    });
  }, []);

  return { inset, scrollAboveKeyboard };
}