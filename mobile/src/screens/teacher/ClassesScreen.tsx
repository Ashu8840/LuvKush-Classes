import { useEffect, useState } from "react";
import { Text, View, Switch, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TeacherStackParamList } from "../../navigation/TeacherNavigator";
import { api, LiveClassSession } from "../../lib/api";
import { paginateSlice } from "../../lib/paginate";
import { useAppRefresh } from "../../contexts/RefreshContext";
import { toast } from "../../contexts/ToastContext";
import { formatDateTime } from "../../lib/utils";
import { Screen, Card, Button, Input, AppModal, Badge, Pagination } from "../../components/ui";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { DateTimePickerField } from "../../components/ui/DateTimePickerField";
import { useTheme } from "../../contexts/ThemeContext";

type Batch = { _id: string; name: string };
type Nav = NativeStackNavigationProp<TeacherStackParamList>;

export default function TeacherClassesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { refreshKey } = useAppRefresh();
  const [classes, setClasses] = useState<LiveClassSession[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [modal, setModal] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    batchId: "",
    scheduledAt: null as Date | null,
    duration: "60",
    waitingRoomEnabled: true,
  });

  const load = () => api.getLiveClasses().then(setClasses).catch(() => toast.error("Failed to load classes"));

  useEffect(() => {
    load();
    api.teacherDashboard().then((d) => setBatches((d.batches as Batch[]) || [])).catch(() => {});
  }, [refreshKey]);

  const schedule = async () => {
    if (!form.title.trim() || !form.scheduledAt) {
      toast.error("Title and schedule time required");
      return;
    }
    try {
      await api.scheduleLiveClass({
        title: form.title.trim(),
        description: form.description,
        batchId: form.batchId || undefined,
        scheduledAt: form.scheduledAt.toISOString(),
        duration: Number(form.duration) || 60,
        waitingRoomEnabled: form.waitingRoomEnabled,
      });
      setModal(false);
      setForm({ title: "", description: "", batchId: "", scheduledAt: null, duration: "60", waitingRoomEnabled: true });
      load();
      toast.success("Class scheduled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule");
    }
  };

  const goLive = async (id: string) => {
    try {
      await api.goLiveClass(id);
      load();
      toast.success("Class is live");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to go live");
    }
  };

  const deleteClass = (id: string) => {
    Alert.alert("Delete class?", "This permanently removes the scheduled or ended class.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteLiveClass(id);
            load();
            toast.success("Class deleted");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Delete failed");
          }
        },
      },
    ]);
  };

  const live = classes.filter((c) => c.status === "live");
  const scheduled = classes.filter((c) => c.status === "scheduled");
  const ended = classes.filter((c) => c.status === "ended");
  const scheduledPage = paginateSlice(scheduled, page);
  const endedPage = paginateSlice(ended, page);

  const enterRoom = (classId: string) => {
    navigation.navigate("LiveClassRoom", { classId, isTeacher: true });
  };

  return (
    <Screen title="Live Classes" action={<Button label="Schedule" onPress={() => setModal(true)} small />}>
      <Text style={{ color: colors.muted, fontSize: 13 }}>
        Schedule classes — admit students, chat, hand raise, video & screen share
      </Text>

      {live.map((c) => (
        <Card key={c._id} style={{ borderColor: "#16a34a", borderWidth: 2 }}>
          <Badge label="LIVE" variant="success" />
          <Text style={{ color: colors.text, fontWeight: "700", marginTop: 8 }}>{c.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{c.participantCount || 0} in class · {c.waitingCount || 0} waiting</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <Button label="Enter Room" small onPress={() => enterRoom(c._id)} />
            <Button label="Delete" small variant="danger" onPress={() => deleteClass(c._id)} />
          </View>
        </Card>
      ))}

      {scheduledPage.items.map((c) => (
        <Card key={c._id}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>{c.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{formatDateTime(c.scheduledAt)} · {c.batch?.name || "All batches"}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <Button label="Go Live" small onPress={() => goLive(c._id)} />
            <Button label="Open" small variant="outline" onPress={() => enterRoom(c._id)} />
            <Button label="Delete" small variant="danger" onPress={() => deleteClass(c._id)} />
          </View>
        </Card>
      ))}

      {scheduled.length > 0 && (
        <Pagination page={scheduledPage.page} pages={scheduledPage.pages} onPageChange={setPage} />
      )}

      {endedPage.items.length > 0 && (
        <>
          <Text style={{ color: colors.muted, fontWeight: "600", marginTop: 12 }}>Recent ended</Text>
          {endedPage.items.map((c) => (
            <Card key={c._id}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>{c.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{formatDateTime(c.scheduledAt)}</Text>
              <Button label="Delete" small variant="danger" onPress={() => deleteClass(c._id)} />
            </Card>
          ))}
        </>
      )}

      <AppModal visible={modal} title="Schedule Live Class" onClose={() => setModal(false)}>
        <Input label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        <Input label="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
        <SelectDropdown
          label="Batch"
          value={form.batchId}
          options={[{ id: "", label: "All batches" }, ...batches.map((b) => ({ id: b._id, label: b.name }))]}
          onChange={(v) => setForm({ ...form, batchId: v })}
        />
        <DateTimePickerField
          label="Scheduled date & time"
          value={form.scheduledAt}
          onChange={(d) => setForm({ ...form, scheduledAt: d })}
          minimumDate={new Date()}
        />
        <Input label="Duration (min)" value={form.duration} onChangeText={(v) => setForm({ ...form, duration: v })} keyboardType="numeric" />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ color: colors.text, flex: 1, fontSize: 13 }}>
            Enable waiting room (admit students before they join video)
          </Text>
          <Switch
            value={form.waitingRoomEnabled}
            onValueChange={(v) => setForm({ ...form, waitingRoomEnabled: v })}
          />
        </View>
        <Button label="Schedule Class" onPress={schedule} />
      </AppModal>
    </Screen>
  );
}