"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { BrandLogo } from "@/components/BrandLogo";
import { api, Fee, UpiDetails } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type Props = {
  fee: Fee;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function UpiPaymentModal({ fee, open, onClose, onSuccess }: Props) {
  const [upi, setUpi] = useState<UpiDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [utr, setUtr] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotPublicId, setScreenshotPublicId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUtr("");
    setScreenshotUrl("");
    setScreenshotPublicId("");
    setLoading(true);
    api
      .getUpiDetails(fee._id)
      .then(setUpi)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load UPI details"))
      .finally(() => setLoading(false));
  }, [open, fee._id]);

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url, publicId } = await api.uploadPaymentProof(file);
      setScreenshotUrl(url);
      setScreenshotPublicId(publicId || "");
      toast.success("Screenshot uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!upi) return;
    if (utr.length !== 12 || !/^\d{12}$/.test(utr)) {
      toast.error("UTR must be exactly 12 numeric digits");
      return;
    }
    if (!screenshotUrl) {
      toast.error("Payment screenshot is required");
      return;
    }

    setSubmitting(true);
    try {
      await api.submitPaymentProof({
        feeId: fee._id,
        amount: upi.amount,
        utr,
        screenshotUrl,
        screenshotPublicId: screenshotPublicId || undefined,
      });
      toast.success("Payment proof submitted! Admin will verify your UTR shortly.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Pay via UPI" className="max-w-md" scoped>
      {loading ? (
        <p className="text-center text-muted">Loading payment details...</p>
      ) : upi ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-default bg-surface p-3 text-center">
            <BrandLogo size="md" framed className="mx-auto" />
            <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(upi.amount)}</p>
            <p className="text-sm text-muted">Pay to {upi.merchantName}</p>
            <p className="mt-0.5 text-xs text-muted">UPI ID: {upi.upiId}</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium">Scan QR with GPay / PhonePe / Paytm</p>
            <div className="rounded-xl border border-default bg-card p-2">
              <QRCodeSVG value={upi.upiUrl} size={150} />
            </div>
            <a
              href={upi.upiUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Smartphone className="h-4 w-4" />
              Open UPI App
            </a>
          </div>

          <p className="flex items-start gap-2 text-center text-xs font-semibold text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Enter the 12-digit UTR from your payment receipt below. Fake IDs will be rejected.
          </p>

          <input
            type="text"
            inputMode="numeric"
            maxLength={12}
            placeholder="Enter 12-Digit UPI Ref / UTR No"
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
            className="input-field w-full rounded-xl border px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-primary"
          />

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-default px-4 py-3 text-sm text-muted transition hover:border-primary hover:text-foreground">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : screenshotUrl ? "Screenshot attached ✓" : "Upload payment screenshot (required)"}
            <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} disabled={uploading} />
          </label>

          {screenshotUrl && (
            <img src={screenshotUrl} alt="Payment proof" className="mx-auto max-h-32 rounded-lg border border-default" />
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || utr.length !== 12 || !screenshotUrl}
            className="w-full rounded-xl bg-success py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Payment Proof"}
          </button>
        </div>
      ) : (
        <p className="text-center text-muted">Unable to load UPI details</p>
      )}
    </Modal>
  );
}