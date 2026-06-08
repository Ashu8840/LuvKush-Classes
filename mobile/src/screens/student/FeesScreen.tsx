import { useEffect, useState } from "react";
import {
  Text, View, Alert, Linking, TextInput, Image, Modal, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { api, Fee, Payment, UpiDetails } from "../../lib/api";
import { toast } from "../../contexts/ToastContext";
import { formatCurrency, formatDate } from "../../lib/utils";
import { Screen, Card, Badge, Button, Loading, getStatusBadgeVariant } from "../../components/ui";
import { BrandLogo } from "../../components/BrandLogo";
import { useTheme } from "../../contexts/ThemeContext";

export default function StudentFeesScreen() {
  const { colors } = useTheme();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payFee, setPayFee] = useState<Fee | null>(null);
  const [upi, setUpi] = useState<UpiDetails | null>(null);
  const [utr, setUtr] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotPublicId, setScreenshotPublicId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUpi, setLoadingUpi] = useState(false);

  const loadData = async () => {
    try {
      const [f, p] = await Promise.all([api.getFees(), api.getPaymentHistory()]);
      setFees(Array.isArray(f) ? f : f.fees);
      setPayments(p);
    } catch {
      Alert.alert("Error", "Failed to load fee data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openPayment = async (fee: Fee) => {
    setPayFee(fee);
    setUtr("");
    setScreenshotUrl("");
    setScreenshotPublicId("");
    setLoadingUpi(true);
    try {
      const details = await api.getUpiDetails(fee._id);
      setUpi(details);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to load UPI details");
      setPayFee(null);
    } finally {
      setLoadingUpi(false);
    }
  };

  const handlePayNow = async () => {
    if (!upi) return;
    try {
      const supported = await Linking.canOpenURL(upi.upiUrl);
      if (supported) {
        await Linking.openURL(upi.upiUrl);
      } else {
        Alert.alert("App Missing", "Please install GPay, PhonePe, or Paytm to complete payment.");
      }
    } catch {
      Alert.alert("Error", "Could not open payment apps.");
    }
  };

  const pickScreenshot = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploading(true);
      const { url, publicId } = await api.uploadPaymentProof(
        asset.uri,
        asset.name || "payment-proof.jpg",
        asset.mimeType || "image/jpeg"
      );
      setScreenshotUrl(url);
      setScreenshotPublicId(publicId || "");
      toast.success("Screenshot uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submitProof = async () => {
    if (!upi || !payFee) return;
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
        feeId: payFee._id,
        amount: upi.amount,
        utr,
        screenshotUrl,
        screenshotPublicId: screenshotPublicId || undefined,
      });
      toast.success("Payment proof submitted. Admin will verify your UTR shortly.");
      setPayFee(null);
      setUpi(null);
      setScreenshotUrl("");
      setScreenshotPublicId("");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Screen title="Fee Payment"><Loading full /></Screen>;

  const pending = fees.filter((f) => f.status !== "paid");
  const paid = fees.filter((f) => f.status === "paid");

  return (
    <Screen title="Fee Payment">
      <Card style={{ backgroundColor: colors.primaryLight }}>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Ionicons name="wallet" size={32} color={colors.primary} />
          <View>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>Pay via UPI</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>GPay · PhonePe · Paytm — then submit 12-digit UTR</Text>
          </View>
        </View>
      </Card>

      <Text style={{ color: colors.text, fontWeight: "600" }}>Pending Fees</Text>
      {pending.length ? pending.map((f) => {
        const hasPendingProof = payments.some((p) => p.fee?._id === f._id && p.status === "pending");
        return (
          <Card key={f._id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>{formatCurrency(f.amount)}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  Paid: {formatCurrency(f.paidAmount)} · Remaining: {formatCurrency(f.amount - f.paidAmount)}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>Due: {formatDate(f.dueDate)}</Text>
              </View>
              <Badge label={f.status} variant={getStatusBadgeVariant(f.status)} />
            </View>
            <View style={{ marginTop: 12 }}>
              {hasPendingProof ? (
                <Text style={{ color: "#d97706", fontSize: 13, fontWeight: "600" }}>Verification pending</Text>
              ) : (
                <Button label="Pay via UPI App" small onPress={() => openPayment(f)} />
              )}
            </View>
          </Card>
        );
      }) : (
        <Card><Text style={{ color: colors.muted, textAlign: "center" }}>All fees paid!</Text></Card>
      )}

      {paid.length > 0 && (
        <>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Paid Fees</Text>
          {paid.map((f) => (
            <Card key={f._id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>{formatCurrency(f.amount)}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>Due: {formatDate(f.dueDate)}</Text>
                </View>
                <Badge label="paid" variant="success" />
              </View>
            </Card>
          ))}
        </>
      )}

      <Text style={{ color: colors.text, fontWeight: "600" }}>Payment History</Text>
      {payments.length ? payments.map((p) => (
        <Card key={p._id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: colors.text, fontWeight: "600" }}>{formatCurrency(p.amount)}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>UTR: {p.utr}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{formatDate(p.createdAt)}</Text>
            </View>
            <Badge label={p.status} variant={getStatusBadgeVariant(p.status)} />
          </View>
        </Card>
      )) : (
        <Text style={{ color: colors.muted }}>No payment history yet</Text>
      )}

      <Modal visible={!!payFee} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" }}>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>Pay via UPI</Text>
                <TouchableOpacity onPress={() => { setPayFee(null); setUpi(null); }}>
                  <Ionicons name="close" size={24} color={colors.muted} />
                </TouchableOpacity>
              </View>

              {loadingUpi ? (
                <ActivityIndicator color={colors.primary} />
              ) : upi ? (
                <>
                  <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, padding: 12, borderRadius: 12, alignItems: "center" }}>
                    <BrandLogo size="md" framed />
                    <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700", marginTop: 8 }}>{formatCurrency(upi.amount)}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>{upi.merchantName}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>UPI: {upi.upiId}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={handlePayNow}
                    style={{ backgroundColor: "#0066cc", padding: 15, borderRadius: 10, alignItems: "center" }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Pay via UPI App (GPay/PhonePe/Paytm)</Text>
                  </TouchableOpacity>

                  <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600", textAlign: "center" }}>
                    Enter the 12-digit UTR from your receipt below to unlock access.
                  </Text>

                  <TextInput
                    style={{
                      borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 10,
                      textAlign: "center", fontSize: 18, letterSpacing: 2, color: colors.text,
                    }}
                    placeholder="Enter 12-Digit UTR"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    maxLength={12}
                    value={utr}
                    onChangeText={(t) => setUtr(t.replace(/\D/g, "").slice(0, 12))}
                  />

                  <TouchableOpacity
                    onPress={pickScreenshot}
                    disabled={uploading}
                    style={{ borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, padding: 14, borderRadius: 10, alignItems: "center" }}
                  >
                    <Text style={{ color: colors.muted }}>
                      {uploading ? "Uploading..." : screenshotUrl ? "Screenshot attached ✓" : "Upload payment screenshot (required)"}
                    </Text>
                  </TouchableOpacity>

                  {screenshotUrl ? (
                    <Image source={{ uri: screenshotUrl }} style={{ height: 120, borderRadius: 8, alignSelf: "center" }} resizeMode="contain" />
                  ) : null}

                  <TouchableOpacity
                    onPress={submitProof}
                    disabled={submitting || utr.length !== 12 || !screenshotUrl}
                    style={{
                      backgroundColor: "#22c55e", padding: 15, borderRadius: 10, alignItems: "center",
                      opacity: submitting || utr.length !== 12 || !screenshotUrl ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {submitting ? "Verifying..." : "Submit Payment Proof"}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}