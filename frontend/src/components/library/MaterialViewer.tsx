"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Download,
  FileText, Video, Mic, BookOpen, ExternalLink, AlertCircle,
} from "lucide-react";
import { LibraryItem } from "@/lib/api";
import { fetchMaterialBlob, getMaterialStreamUrl, shouldUseStream } from "@/lib/material";
import { Modal } from "@/components/ui/modal";

const Document = dynamic(() => import("react-pdf").then((m) => m.Document), { ssr: false });
const Page = dynamic(() => import("react-pdf").then((m) => m.Page), { ssr: false });

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

function isPdfItem(item: LibraryItem) {
  return shouldUseStream(item);
}

const typeColors: Record<string, string> = {
  pdf: "from-rose-500/20 to-rose-600/5",
  paper: "from-amber-500/20 to-amber-600/5",
  video: "from-blue-500/20 to-blue-600/5",
  audio: "from-violet-500/20 to-violet-600/5",
  note: "from-emerald-500/20 to-emerald-600/5",
};

export function MaterialCard({
  item,
  onOpen,
  onDelete,
}: {
  item: LibraryItem;
  onOpen: (item: LibraryItem) => void;
  onDelete?: (id: string) => void;
}) {
  const icons: Record<string, React.ReactNode> = {
    pdf: <FileText className="h-6 w-6 text-rose-500" />,
    video: <Video className="h-6 w-6 text-blue-500" />,
    audio: <Mic className="h-6 w-6 text-violet-500" />,
    note: <BookOpen className="h-6 w-6 text-emerald-500" />,
    paper: <FileText className="h-6 w-6 text-amber-500" />,
  };

  const gradient = typeColors[item.type] || "from-primary/15 to-primary/5";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-default bg-card text-left transition hover:border-accent/50 hover:shadow-lg">
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}
          className="absolute right-3 top-3 z-10 rounded-lg bg-card/90 p-1.5 text-danger opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-danger-light"
          aria-label="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <button type="button" onClick={() => onOpen(item)} className="relative w-full p-5 text-left">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 transition group-hover:opacity-100`} />
        <div className="relative">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-default bg-card/80 shadow-sm">
            {icons[item.type] || <FileText className="h-6 w-6" />}
          </div>
          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
            {item.category}
          </span>
          <h4 className="mt-2 line-clamp-2 font-semibold text-foreground group-hover:text-accent">
            {item.title}
          </h4>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span className="capitalize">{item.type}</span>
            {item.batch?.name && <span>{item.batch.name}</span>}
            {item.teacher?.name && !item.batch?.name && <span>{item.teacher.name}</span>}
          </div>
          <p className="mt-3 text-xs font-medium text-accent opacity-0 transition group-hover:opacity-100">
            Open in reader →
          </p>
        </div>
      </button>
    </div>
  );
}

export function MaterialViewerModal({
  item,
  open,
  onClose,
}: {
  item: LibraryItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string | null>(null);
  const [loadingNote, setLoadingNote] = useState(false);

  useEffect(() => {
    if (!open) return;
    import("react-pdf").then((m) => {
      m.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${m.pdfjs.version}/build/pdf.worker.min.mjs`;
      setPdfReady(true);
    });
  }, [open]);

  useEffect(() => {
    if (!open || !item) return;
    setPage(1);
    setScale(1);
    setNumPages(0);
    setNoteText(null);
    setPdfBlob(null);
    setPdfError(null);

    if (isPdfItem(item)) {
      setPdfLoading(true);
      fetchMaterialBlob(item._id)
        .then((blob) => setPdfBlob(blob))
        .catch(() => {
          setPdfBlob(getMaterialStreamUrl(item._id, true));
        })
        .finally(() => setPdfLoading(false));
    }

    if (item.type === "note" && !isImageUrl(item.url)) {
      setLoadingNote(true);
      fetch(getMaterialStreamUrl(item._id), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      })
        .then((r) => r.text())
        .then(setNoteText)
        .catch(() => setNoteText(item.description || "Unable to load note content."))
        .finally(() => setLoadingNote(false));
    }
  }, [open, item]);

  const onDocumentLoad = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPage(1);
    setPdfError(null);
  }, []);

  const onPdfError = useCallback((err: Error) => {
    setPdfError(err?.message || "Failed to load PDF");
  }, []);

  if (!item) return null;

  const showPdf = isPdfItem(item);
  const showImage = isImageUrl(item.url) && !showPdf;
  const downloadUrl = showPdf ? getMaterialStreamUrl(item._id, true) : item.url;

  return (
    <Modal open={open} onClose={onClose} title={item.title} className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-accent">
            {item.type}
          </span>
          <span>·</span>
          <span className="capitalize">{item.category}</span>
        </div>
        <div className="flex items-center gap-2">
          {showPdf && !pdfError && (
            <>
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
                className="rounded-lg border border-default p-2 hover:bg-surface"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-[3rem] text-center text-xs text-muted">{Math.round(scale * 100)}%</span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(2, s + 0.15))}
                className="rounded-lg border border-default p-2 hover:bg-surface"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </>
          )}
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-default px-3 py-2 text-xs font-medium hover:bg-surface"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-xl border border-default bg-surface">
        {showPdf && pdfReady && (
          <div className="flex flex-col items-center gap-4 p-4">
            {pdfLoading && <p className="p-8 text-sm text-muted">Loading PDF…</p>}
            {pdfError && (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <AlertCircle className="h-10 w-10 text-danger" />
                <p className="text-sm text-muted">{pdfError}</p>
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent hover:underline">
                  Open in new tab
                </a>
              </div>
            )}
            {!pdfLoading && pdfBlob && !pdfError && (
              <Document
                file={pdfBlob}
                onLoadSuccess={onDocumentLoad}
                onLoadError={onPdfError}
                loading={<p className="p-8 text-sm text-muted">Rendering PDF…</p>}
              >
                <Page
                  pageNumber={page}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-md"
                />
              </Document>
            )}
            {numPages > 1 && !pdfError && (
              <div className="sticky bottom-0 flex items-center gap-3 rounded-full border border-default bg-card px-4 py-2 shadow-lg">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg p-1.5 disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium">
                  Page {page} of {numPages}
                </span>
                <button
                  type="button"
                  disabled={page >= numPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg p-1.5 disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {showImage && (
          <div className="flex min-h-[300px] items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.title} className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-md" />
          </div>
        )}

        {item.type === "video" && (
          <video src={item.url} controls className="w-full" playsInline>
            <track kind="captions" />
          </video>
        )}

        {item.type === "audio" && (
          <div className="flex flex-col items-center gap-6 p-12">
            <Mic className="h-16 w-16 text-primary opacity-60" />
            <audio src={item.url} controls className="w-full max-w-md" />
          </div>
        )}

        {item.type === "note" && !showImage && (
          <div className="p-6">
            {loadingNote ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {noteText || item.description || "No content available."}
              </pre>
            )}
          </div>
        )}

        {!showPdf && !showImage && item.type !== "video" && item.type !== "audio" && item.type !== "note" && (
          <div className="flex flex-col items-center gap-4 p-12 text-center">
            <ExternalLink className="h-10 w-10 text-muted" />
            <p className="text-sm text-muted">Preview not available for this format.</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent hover:underline">
              Open externally
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
}