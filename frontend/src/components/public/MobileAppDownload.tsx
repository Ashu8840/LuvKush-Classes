import { Download, Smartphone } from "lucide-react";

const APK_URL = "/LuvKush.apk";
const APK_FILENAME = "LuvKush.apk";

export function MobileAppDownload({ variant = "section" }: { variant?: "hero" | "section" }) {
  if (variant === "hero") {
    return (
      <a
        href={APK_URL}
        download={APK_FILENAME}
        className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#facc15] bg-[#facc15]/10 px-6 py-3 text-xs font-bold uppercase tracking-wider text-foreground shadow-sm transition hover:bg-[#facc15]/20 hover:shadow-[#facc15]/20 active:scale-[0.985] sm:px-8 sm:py-3.5 sm:text-sm"
      >
        <Smartphone className="h-4 w-4 text-[#eab308]" />
        Download App
      </a>
    );
  }

  return (
    <section
      id="mobile-app"
      className="scroll-mt-24 border-y border-default bg-surface py-12 md:py-14"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 sm:px-8 lg:flex-row lg:justify-between lg:px-12">
        <div className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
          <div className="inline-flex rounded-2xl bg-[#facc15]/20 p-4">
            <Smartphone className="h-8 w-8 text-[#eab308]" />
          </div>
          <p className="mt-5 text-sm font-bold uppercase tracking-widest text-accent">
            Mobile App
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
            Learn on Your Android Phone
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Download the Luv Kush Classes app to access typing practice, shorthand
            dictation, fees, live classes, certificates, and your dashboard — anytime,
            anywhere.
          </p>
          <p className="mt-3 text-xs text-muted">
            Android only · Free download · Install directly from this site
          </p>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-default/50 bg-card p-8 shadow-xl lg:max-w-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#facc15]">
            <Download className="h-8 w-8 text-black" />
          </div>
          <p className="mt-5 text-center text-sm font-semibold text-foreground">
            Luv Kush Classes
          </p>
          <p className="mt-1 text-center text-xs text-muted">Android APK · v1.0</p>
          <a
            href={APK_URL}
            download={APK_FILENAME}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#facc15] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-black shadow-md transition hover:bg-yellow-500 hover:opacity-95 active:scale-[0.985]"
          >
            <Download className="h-4 w-4" />
            Download APK
          </a>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
            If install is blocked, allow your browser to install unknown apps in Android
            settings.
          </p>
        </div>
      </div>
    </section>
  );
}