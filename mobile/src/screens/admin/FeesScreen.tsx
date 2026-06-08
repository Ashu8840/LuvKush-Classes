import { useEffect, useState } from "react";
import { Text, View, Image, Linking, Pressable, Share } from "react-native";
import { api, Payment, Pagination } from "../../lib/api";
import { toast } from "../../contexts/ToastContext";
import { formatCurrency, formatDate } from "../../lib/utils";
import { Screen, Card, Button, Input, AppModal, Badge, PillGroup, Empty } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { useTheme } from "../../contexts/ThemeContext";

type Fee = {
  _id: string;
  student?: { _id: string; name: string; email?: string; phone?: string };
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  remarks?: string;
  createdAt?: string;
};
type Student = { user: { _id: string; name: string } };
type Tab = "records" | "approvals";

const STATUS_OPTIONS = [
  { id: "", label: "All statuses" },
  { id: "pending", label: "Pending" },
  { id: "partial", label: "Partial" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
];

const emptyForm = () => ({ studentId: "", amount: "", dueDate: "", remarks: "" });

const escapeCsv = (val: unknown) => {
  const str = String(val ?? "");
  return str.includes(",") || str.includes('"') || str.includes("\n")
    ? `"${str.replace(/"/g, '""')}"`
    : str;
};

const toCsv = (headers: string[], rows: unknown[][]) =>
  [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");

async function fetchAllFees(from: string, to: string) {
  const all: Fee[] = [];
  let page = 1;
  let pages = 1;
  do {
    const params = new URLSearchParams({ page: String(page), limit: "50", fromDate: from, toDate: to });
    const data = await api.getFees(params.toString());
    if (Array.isArray(data)) return data as Fee[];
    all.push(...(data.fees as Fee[]));
    pages = data.pagination.pages;
    page += 1;
  } while (page <= pages);
  return all;
}

async function fetchAllPayments(from: string, to: string) {
  const all: Payment[] = [];
  let page = 1;
  let pages = 1;
  do {
    const params = new URLSearchParams({ page: String(page), limit: "50", fromDate: from, toDate: to });
    const data = await api.getAdminPaymentHistory(params.toString());
    all.push(...data.payments);
    pages = data.pagination.pages;
    page += 1;
  } while (page <= pages);
  return all;
}

export default function AdminFeesScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>("records");
  const [fees, setFees] = useState<Fee[]>([]);
  const [feePagination, setFeePagination] = useState<Pagination>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [pending, setPending] = useState<Payment[]>([]);
  const [approvalPagination, setApprovalPagination] = useState<Pagination>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [students, setStudents] = useState<Student[]>([]);
  const [modal, setModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [exportTarget, setExportTarget] = useState<"fees" | "approvals">("fees");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const [reviewPayment, setReviewPayment] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [statusFilter, setStatusFilter] = useState("");
  const [feePage, setFeePage] = useState(1);
  const [approvalPage, setApprovalPage] = useState(1);

  const loadFees = (page = feePage) => {
    const params = new URLSearchParams({ page: String(page), limit: "6" });
    if (statusFilter) params.set("status", statusFilter);
    api.getFees(params.toString()).then((data) => {
      if (Array.isArray(data)) {
        setFees(data as Fee[]);
        setFeePagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
      } else {
        setFees(data.fees as Fee[]);
        setFeePagination(data.pagination);
      }
    }).catch(() => toast.error("Failed to load fees"));
  };

  const loadApprovals = (page = approvalPage) => {
    const params = new URLSearchParams({ page: String(page), limit: "6" });
    api.getPendingPayments(params.toString()).then((data) => {
      if (Array.isArray(data)) {
        setPending(data);
        setApprovalPagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
      } else {
        setPending(data.payments);
        setApprovalPagination(data.pagination);
      }
    }).catch(() => toast.error("Failed to load approvals"));
  };

  const loadStudents = () => {
    api.adminStudents().then((d) => setStudents((d.profiles as Student[]) || [])).catch(() => {});
  };

  useEffect(() => {
    loadStudents();
    loadFees(1);
    loadApprovals(1);
  }, []);

  useEffect(() => { loadFees(feePage); }, [feePage, statusFilter]);
  useEffect(() => { loadApprovals(approvalPage); }, [approvalPage]);

  const submit = async () => {
    if (!form.studentId) {
      toast.error("Please select a student");
      return;
    }
    setLoading(true);
    try {
      await api.createFee({
        student: form.studentId,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        remarks: form.remarks || undefined,
      });
      setModal(false);
      setForm(emptyForm());
      setFeePage(1);
      loadFees(1);
      toast.success("Fee record created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create fee");
    } finally {
      setLoading(false);
    }
  };

  const pay = async (fee: Fee) => {
    try {
      await api.recordPayment(fee._id, {
        paidAmount: fee.amount - fee.paidAmount,
        paymentMethod: "cash",
        receiptNumber: `RCP-${Date.now()}`,
      });
      loadFees(feePage);
      toast.success("Payment recorded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    }
  };

  const approve = async (id: string) => {
    try {
      await api.approvePayment(id);
      setReviewPayment(null);
      toast.success("Payment verified and fee updated");
      loadApprovals(approvalPage);
      loadFees(feePage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    }
  };

  const reject = async (id: string) => {
    try {
      await api.rejectPayment(id, rejectReason || "UTR could not be verified");
      setReviewPayment(null);
      setRejectReason("");
      toast.success("Payment rejected");
      loadApprovals(approvalPage);
      loadFees(feePage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rejection failed");
    }
  };

  const runExport = async () => {
    if (!exportFrom || !exportTo) {
      toast.error("Select from and to dates");
      return;
    }
    setExporting(true);
    try {
      let csv: string;
      if (exportTarget === "fees") {
        const rows = await fetchAllFees(exportFrom, exportTo);
        csv = toCsv(
          ["Student", "Email", "Phone", "Amount", "Paid", "Due Date", "Status", "Remarks", "Created At"],
          rows.map((f) => [
            f.student?.name || "",
            f.student?.email || "",
            f.student?.phone || "",
            f.amount,
            f.paidAmount || 0,
            f.dueDate ? new Date(f.dueDate).toISOString().split("T")[0] : "",
            f.status,
            f.remarks || "",
            f.createdAt ? new Date(f.createdAt).toISOString() : "",
          ])
        );
      } else {
        const rows = await fetchAllPayments(exportFrom, exportTo);
        csv = toCsv(
          ["Student", "Email", "Amount", "UTR", "Status", "Submitted At", "Reviewed At", "Rejection Reason"],
          rows.map((p) => [
            p.student?.name || "",
            p.student?.email || "",
            p.amount,
            p.utr,
            p.status,
            p.createdAt ? new Date(p.createdAt).toISOString() : "",
            "",
            p.rejectionReason || "",
          ])
        );
      }
      await Share.share({ message: csv, title: `${exportTarget}-${exportFrom}-to-${exportTo}.csv` });
      setExportModal(false);
      toast.success("Export ready — share or save the CSV");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const studentOptions = [
    { id: "", label: "— Select student —" },
    ...students.map((s) => ({ id: s.user._id, label: s.user.name })),
  ];

  const openExport = (target: "fees" | "approvals") => {
    setExportTarget(target);
    setExportModal(true);
  };

  return (
    <Screen title="Fees Management" action={<Button label="Add Fee" onPress={() => setModal(true)} small />}>
      <PillGroup
        options={[
          { id: "records", label: "Fee Records" },
          { id: "approvals", label: approvalPagination.total > 0 ? `Approvals (${approvalPagination.total})` : "Approvals" },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />

      {tab === "records" && (
        <>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <SelectDropdown
                label="Status"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={(v) => { setStatusFilter(v); setFeePage(1); }}
              />
            </View>
            <Button label="Export" small variant="outline" onPress={() => openExport("fees")} />
          </View>

          {fees.length === 0 ? (
            <Empty message="No fee records found" />
          ) : (
            fees.map((f) => (
              <Card key={f._id}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>{f.student?.name || "—"}</Text>
                <Text style={{ color: colors.muted }}>{formatCurrency(f.amount)} · Paid {formatCurrency(f.paidAmount)}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>Due: {formatDate(f.dueDate)}</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <Badge label={f.status} variant={f.status === "paid" ? "success" : "warning"} />
                  {f.status !== "paid" && <Button label="Record Cash" onPress={() => pay(f)} small />}
                </View>
              </Card>
            ))
          )}

          {feePagination.pages > 1 && (
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 16, marginBottom: 24 }}>
              <Pressable disabled={feePage <= 1} onPress={() => setFeePage((p) => p - 1)} style={{ opacity: feePage <= 1 ? 0.4 : 1 }}>
                <Text style={{ color: colors.accent }}>Previous</Text>
              </Pressable>
              <Text style={{ color: colors.muted }}>{feePage} / {feePagination.pages}</Text>
              <Pressable disabled={feePage >= feePagination.pages} onPress={() => setFeePage((p) => p + 1)} style={{ opacity: feePage >= feePagination.pages ? 0.4 : 1 }}>
                <Text style={{ color: colors.accent }}>Next</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      {tab === "approvals" && (
        <>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
            <Button label="Export Approvals" small variant="outline" onPress={() => openExport("approvals")} />
          </View>

          {pending.length === 0 ? (
            <Empty message="No pending payment proofs" />
          ) : (
            pending.map((p) => (
              <Card key={p._id} style={{ borderColor: "#fed7aa", borderWidth: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>{p.student?.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>{p.student?.email}</Text>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 4 }}>{formatCurrency(p.amount)}</Text>
                <Text style={{ color: colors.text, fontFamily: "monospace", marginTop: 4 }}>UTR: {p.utr}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{formatDate(p.createdAt)}</Text>
                <View style={{ marginTop: 10 }}>
                  <Button label="Review" small onPress={() => { setReviewPayment(p); setRejectReason(""); }} />
                </View>
              </Card>
            ))
          )}

          {approvalPagination.pages > 1 && (
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 16, marginBottom: 24 }}>
              <Pressable disabled={approvalPage <= 1} onPress={() => setApprovalPage((p) => p - 1)} style={{ opacity: approvalPage <= 1 ? 0.4 : 1 }}>
                <Text style={{ color: colors.accent }}>Previous</Text>
              </Pressable>
              <Text style={{ color: colors.muted }}>{approvalPage} / {approvalPagination.pages}</Text>
              <Pressable disabled={approvalPage >= approvalPagination.pages} onPress={() => setApprovalPage((p) => p + 1)} style={{ opacity: approvalPage >= approvalPagination.pages ? 0.4 : 1 }}>
                <Text style={{ color: colors.accent }}>Next</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      <AppModal visible={modal} title="Add Fee Record" onClose={() => setModal(false)}>
        <SelectDropdown
          label="Student"
          value={form.studentId || studentOptions[0]?.id || ""}
          options={studentOptions}
          onChange={(v) => setForm({ ...form, studentId: v })}
        />
        <Input label="Amount (₹)" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="numeric" />
        <Input label="Due Date (YYYY-MM-DD)" value={form.dueDate} onChangeText={(v) => setForm({ ...form, dueDate: v })} />
        <Input label="Remarks (optional)" value={form.remarks} onChangeText={(v) => setForm({ ...form, remarks: v })} />
        <Button label={loading ? "Creating..." : "Create Fee"} onPress={submit} disabled={loading || !form.studentId} />
      </AppModal>

      <AppModal visible={exportModal} title={exportTarget === "fees" ? "Export Fee Records" : "Export Payment Approvals"} onClose={() => setExportModal(false)}>
        <Input label="From Date (YYYY-MM-DD)" value={exportFrom} onChangeText={setExportFrom} placeholder="2026-01-01" />
        <Input label="To Date (YYYY-MM-DD)" value={exportTo} onChangeText={setExportTo} placeholder="2026-06-30" />
        <Button label={exporting ? "Exporting..." : "Share CSV"} onPress={runExport} disabled={exporting} />
      </AppModal>

      <AppModal
        visible={!!reviewPayment}
        title="Review Payment"
        onClose={() => { setReviewPayment(null); setRejectReason(""); }}
      >
        {reviewPayment && (
          <>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>{reviewPayment.student?.name}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{reviewPayment.student?.email}</Text>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 8 }}>
              {formatCurrency(reviewPayment.amount)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Submitted: {formatDate(reviewPayment.createdAt)}</Text>

            <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.surface, borderRadius: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>12-Digit UTR</Text>
              <Text style={{ color: colors.text, fontFamily: "monospace", fontSize: 18, fontWeight: "700", marginTop: 4, letterSpacing: 1 }}>
                {reviewPayment.utr}
              </Text>
              {reviewPayment.utr.length !== 12 && (
                <Text style={{ color: "#d97706", fontSize: 12, marginTop: 4 }}>
                  Warning: UTR should be 12 digits ({reviewPayment.utr.length} provided)
                </Text>
              )}
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 8 }}>
                Payment Screenshot
              </Text>
              {reviewPayment.screenshotUrl ? (
                <>
                  <Image
                    source={{ uri: reviewPayment.screenshotUrl }}
                    style={{ width: "100%", height: 280, borderRadius: 12, backgroundColor: colors.surface }}
                    resizeMode="contain"
                  />
                  <Button
                    label="Open Full Screenshot"
                    small
                    variant="outline"
                    onPress={() => Linking.openURL(reviewPayment.screenshotUrl!)}
                  />
                </>
              ) : (
                <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, borderRadius: 12, padding: 24, alignItems: "center" }}>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>No screenshot uploaded</Text>
                </View>
              )}
            </View>

            <Input
              label="Rejection reason (optional)"
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="UTR could not be verified"
            />

            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Button label="Approve" onPress={() => approve(reviewPayment._id)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Reject" variant="danger" onPress={() => reject(reviewPayment._id)} />
              </View>
            </View>
          </>
        )}
      </AppModal>
    </Screen>
  );
}