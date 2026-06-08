import { Text } from "react-native";
import { ParentChild } from "../../lib/api";
import { PillGroup } from "../ui";

type ChildSelectorProps = {
  children: ParentChild[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ChildSelector({ children, selectedId, onSelect }: ChildSelectorProps) {
  if (!children.length) {
    return <Text style={{ textAlign: "center", padding: 16, opacity: 0.6 }}>
      No linked children found. Contact the institute admin.
    </Text>;
  }

  return (
    <PillGroup
      options={children.map((c) => ({ id: c.student._id, label: c.student.name }))}
      value={selectedId}
      onChange={onSelect}
    />
  );
}