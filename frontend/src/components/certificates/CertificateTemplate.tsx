"use client";

import Image from "next/image";

export type CertificateData = {
  certificateId: string;
  title?: string;
  program?: { title: string };
  student?: { name: string };
  percentage?: number;
  score?: number;
  issuedAt: string;
};

export function CertificateTemplate({
  cert,
  studentName,
  className = "",
}: {
  cert: CertificateData;
  studentName?: string;
  className?: string;
}) {
  const name = studentName || cert.student?.name || "Student";
  const programTitle = cert.program?.title || cert.title || "Certification Program";
  const issued = new Date(cert.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const pct = cert.percentage ?? cert.score ?? 0;

  return (
    <div
      className={`relative mx-auto max-w-3xl border-[6px] border-double border-amber-700 bg-white p-10 shadow-2xl print:shadow-none ${className}`}
      id="certificate-print"
    >
      <div className="pointer-events-none absolute left-4 top-4 h-14 w-14 border-l-4 border-t-4 border-amber-600" />
      <div className="pointer-events-none absolute bottom-4 right-4 h-14 w-14 border-b-4 border-r-4 border-amber-600" />

      <div className="border-2 border-amber-300 px-8 py-10 text-center">
        <Image src="/logo.png" alt="Luv Kush Classes" width={88} height={88} className="mx-auto object-contain" />
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-amber-800">Luv Kush Classes</p>
        <div className="mx-auto my-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-600 text-2xl">
          🏆
        </div>
        <h2 className="font-serif text-3xl font-normal tracking-wide text-amber-900">Certificate of Completion</h2>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-amber-600">This is to certify that</p>
        <p className="mx-auto mt-6 inline-block min-w-[280px] border-b-2 border-amber-400 pb-2 font-serif text-3xl font-bold text-slate-800">
          {name}
        </p>
        <p className="mt-6 text-lg italic text-slate-600">
          has successfully completed the certification program
        </p>
        <p className="mt-2 text-xl font-semibold text-slate-700">{programTitle}</p>

        <div className="mt-10 flex flex-wrap justify-center gap-10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Score</p>
            <p className="text-lg font-semibold text-slate-700">{pct}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Issued On</p>
            <p className="text-lg font-semibold text-slate-700">{issued}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Status</p>
            <p className="text-lg font-semibold text-emerald-600">Verified ✓</p>
          </div>
        </div>

        <p className="mt-10 font-mono text-[11px] tracking-wide text-slate-400">
          Certificate ID: {cert.certificateId}
        </p>
      </div>
    </div>
  );
}