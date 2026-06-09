import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ThemeInit } from "@/components/ThemeInit";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Luv Kush Classes | Shorthand & Typing Coaching",
  description: "Modern coaching platform for shorthand and typing courses",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-color-theme="orange" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head><ThemeInit /></head>
      <body className="min-h-full bg-surface text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}