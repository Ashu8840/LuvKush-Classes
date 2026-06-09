"use client";

import { useEffect } from "react";
import { cleanHomeUrl } from "@/lib/public-scroll";

/** On home page load/refresh: strip hash from URL and show the hero section. */
export function HomePageInit() {
  useEffect(() => {
    cleanHomeUrl();
    window.scrollTo(0, 0);
  }, []);

  return null;
}