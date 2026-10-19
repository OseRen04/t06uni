import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import type { Course, NewCourse } from "@/types";

const BUILDINGS = ["学部棟", "研究棟A", "研究棟B", "図書館", "体育館", "講義棟"];
const DAYS = ["月", "火", "水", "木", "金"];

type Props = {
  existingCourses: Course[];
  onAdd: (data: NewCourse) => void;
  onClose: () => void;
};

export function AddCourseModal({ existingCourses, onAdd, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("学部棟");
  const [floor, setFloor] = useState(1);
  const [roomNumber, setRoomNumber] = useState("");
  const [professor, setProfessor] = useState("");
  const [day, setDay] = useState(0);
  const [period, setPeriod] = useState(1);

  // 0 = 閉じている, 1 = 開いている。背景の透明度とシートの位置を同じ値で動かす
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, { toValue: 1, damping: 30, stiffness: 280, useNativeDriver: true }).start();
  }, [progress]);

  const animateOut = (then: () => void) => {
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => then());
  };

  const conflict = existingCourses.some(c => c.day === day && c.period === period);
  const canSubmit = name.trim() !== "" && roomNumber.trim() !== "" && !conflict;

  const handleAdd = () => {
    if (!canSubmit) return;
    const data = { name: name.trim(), building, floor, roomNumber: roomNumber.trim(), professor: professor.trim(), day, period };
    animateOut(() => onAdd(data));
  };

  const close = () => animateOut(onClose);

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="閉じる" />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetContainer}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: windowHeight * 0.92,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [windowHeight, 0] }) }],
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.titleRow}>
              <Text style={styles.title}>講義を追加</Text>
              <Pressable onPress={close} style={styles.closeButton} accessibilityLabel="閉じる">
                <X size={16} color="#5F6368" />
              </Pressable>
            </View>

            <View style={{ gap: 20 }}>
              {/* 講義名 */}
              <Field label="講義名 *">
                <TextInput
                  value={name} onChangeText={setName}
                  placeholder="例：マーケティング論" placeholderTextColor="#9AA0A6"
                  style={styles.input}
                />
              </Field>

              {/* 担当教員 */}
              <Field label="担当教員">
                <TextInput
                  value={professor} onChangeText={setProfessor}
                  placeholder="例：田中 教授" placeholderTextColor="#9AA0A6"
                  style={styles.input}
                />
              </Field>

              {/* 曜日・時限 */}
              <Field label="曜日">
                <View style={styles.chipRow}>
                  {DAYS.map((d, i) => (
                    <Chip key={i} label={d} selected={day === i} onPress={() => setDay(i)} style={{ flex: 1 }} />
                  ))}
                </View>
              </Field>

              <Field label="時限">
                <View style={styles.chipRow}>
                  {[1, 2, 3, 4, 5].map(p => (
                    <Chip key={p} label={`${p}限`} selected={period === p} onPress={() => setPeriod(p)} style={{ flex: 1 }} />
                  ))}
                </View>
                {conflict && (
                  <Text style={styles.conflict}>⚠ この曜日・時限にはすでに講義があります</Text>
                )}
              </Field>

              {/* 棟 */}
              <Field label="棟">
                <View style={[styles.chipRow, { flexWrap: "wrap", gap: 8 }]}>
                  {BUILDINGS.map(b => (
                    <Chip
                      key={b} label={b} selected={building === b} onPress={() => setBuilding(b)}
                      small style={{ paddingHorizontal: 14, paddingVertical: 8 }}
                    />
                  ))}
                </View>
              </Field>

              {/* 階層・教室番号 */}
              <View style={styles.floorRoomRow}>
                <View style={{ width: 130 }}>
                  <Text style={styles.label}>階層</Text>
                  <View style={styles.chipRow}>
                    {[1, 2, 3, 4].map(f => (
                      <Chip key={f} label={`${f}F`} selected={floor === f} onPress={() => setFloor(f)} small style={{ flex: 1 }} />
                    ))}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>教室番号 *</Text>
                  <TextInput
                    value={roomNumber} onChangeText={setRoomNumber}
                    placeholder="例：203" placeholderTextColor="#9AA0A6"
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleAdd}
              disabled={!canSubmit}
              style={[styles.submit, { backgroundColor: canSubmit ? "#1A73E8" : "#E8EAED" }]}
            >
              <Text style={[styles.submitText, { color: canSubmit ? "white" : "#9AA0A6" }]}>追加する</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

function Chip({ label, selected, onPress, small, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? "#1A73E8" : "#F1F3F4" }, style]}
    >
      <Text style={[styles.chipText, small && { fontSize: 13 }, { color: selected ? "white" : "#5F6368" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0,0,0,0.4)" },
  sheetContainer: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handleRow: { alignItems: "center", paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB" },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "700", color: "#202124" },
  closeButton: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  label: { fontSize: 12, fontWeight: "700", color: "#80868B", marginBottom: 6 },
  input: {
    fontSize: 15,
    color: "#202124",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#DADCE0",
  },
  chipRow: { flexDirection: "row", gap: 6 },
  chip: { paddingVertical: 10, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  chipText: { fontSize: 14, fontWeight: "600" },
  conflict: { fontSize: 11, color: "#EA4335", marginTop: 5 },
  floorRoomRow: { flexDirection: "row", gap: 12, alignItems: "flex-end" },
  submit: { marginTop: 28, paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  submitText: { fontSize: 16, fontWeight: "700" },
});
