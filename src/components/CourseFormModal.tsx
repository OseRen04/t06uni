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
import { Plus, Search, X } from "lucide-react-native";
import type { Course, NewCourse } from "@/types";
import { CATALOG } from "@/data/catalog";
import { CLASSROOM_BUILDINGS } from "@/data/campus";
import { DAYS, PERIODS, formatLocation, formatPeriod, formatSlot } from "@/lib/schedule";
import { matchesQuery, tokenize } from "@/lib/search";

type Props = {
  existingCourses: Course[];
  editing?: Course;   // 指定があれば編集モード
  onSubmit: (data: NewCourse) => void;
  onClose: () => void;
};

export function CourseFormModal({ existingCourses, editing, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [name, setName] = useState(editing?.name ?? "");
  const [building, setBuilding] = useState(editing?.building ?? CLASSROOM_BUILDINGS[0]);
  const [floor, setFloor] = useState(editing?.floor ?? 1);
  const [roomNumber, setRoomNumber] = useState(editing?.roomNumber ?? "");
  const [professor, setProfessor] = useState(editing?.professor ?? "");
  const [day, setDay] = useState(editing?.day ?? 0);
  const [period, setPeriod] = useState(editing?.period ?? 1);

  // 0 = 閉じている, 1 = 開いている。背景の透明度とシートの位置を同じ値で動かす
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, { toValue: 1, damping: 30, stiffness: 280, useNativeDriver: true }).start();
  }, [progress]);

  const animateOut = (then: () => void) => {
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => then());
  };

  // 編集中の講義自身とは重複扱いしない
  const others = existingCourses.filter(c => c.id !== editing?.id);
  const occupant = (d: number, p: number) => others.find(c => c.day === d && c.period === p);
  const conflict = occupant(day, period);
  const canSubmit = name.trim() !== "" && roomNumber.trim() !== "" && !conflict;

  const submit = (data: NewCourse) => animateOut(() => onSubmit(data));

  const handleSubmit = () => {
    if (!canSubmit) return;
    submit({ name: name.trim(), building, floor, roomNumber: roomNumber.trim(), professor: professor.trim(), day, period });
  };

  const close = () => animateOut(onClose);

  // 授業登録検索:授業名・曜日・時限(何コマ)・教員名で授業一覧を探す
  const tokens = tokenize(query);
  const catalogResults = tokens.length
    ? CATALOG.filter(c => matchesQuery(tokens, { texts: [c.name, c.professor], day: c.day, period: c.period }))
    : [];

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
              <Text style={styles.title}>{editing ? "講義を編集" : "講義を追加"}</Text>
              <Pressable onPress={close} style={styles.closeButton} accessibilityLabel="閉じる">
                <X size={16} color="#5F6368" />
              </Pressable>
            </View>

            {/* 授業登録検索(追加のときだけ) */}
            {!editing && (
              <View style={styles.catalog}>
                <Text style={styles.label}>授業を検索して登録</Text>
                <View style={styles.catalogSearch}>
                  <Search size={14} color="#80868B" />
                  <TextInput
                    value={query} onChangeText={setQuery}
                    placeholder="授業名・曜日・何コマ・教員名(例:月曜 2限)" placeholderTextColor="#9AA0A6"
                    style={styles.catalogInput}
                  />
                  {query !== "" && (
                    <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="検索をクリア">
                      <X size={14} color="#80868B" />
                    </Pressable>
                  )}
                </View>

                {tokens.length > 0 && catalogResults.length === 0 && (
                  <Text style={styles.catalogEmpty}>一致する授業がありません。下のフォームから手入力で追加できます</Text>
                )}
                {catalogResults.map(c => {
                  const taken = occupant(c.day, c.period);
                  const registered = taken?.name === c.name;
                  return (
                    <View key={`${c.name}-${c.day}-${c.period}`} style={styles.catalogRow}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.catalogName} numberOfLines={1}>{c.name}</Text>
                        <Text style={styles.catalogMeta}>{formatSlot(c.day, c.period)}　{c.professor}</Text>
                        <Text style={styles.catalogMeta}>{formatLocation(c)}</Text>
                        {taken && !registered && (
                          <Text style={styles.catalogConflict}>この時間には「{taken.name}」が登録済み</Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => submit(c)}
                        disabled={!!taken}
                        style={[styles.catalogAdd, taken && styles.catalogAddDisabled]}
                        accessibilityLabel={`${c.name}を登録`}
                      >
                        {registered ? (
                          <Text style={styles.catalogAddDoneText}>登録済み</Text>
                        ) : (
                          <>
                            <Plus size={14} color={taken ? "#9AA0A6" : "white"} />
                            <Text style={[styles.catalogAddText, taken && { color: "#9AA0A6" }]}>登録</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  );
                })}

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>見つからないときは手入力</Text>
                  <View style={styles.dividerLine} />
                </View>
              </View>
            )}

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
                  {PERIODS.map(({ period: p }) => (
                    <Chip key={p} label={formatPeriod(p)} selected={period === p} onPress={() => setPeriod(p)} style={{ flex: 1 }} />
                  ))}
                </View>
                {conflict && (
                  <Text style={styles.conflict}>⚠ {formatSlot(day, period)}にはすでに「{conflict.name}」があります</Text>
                )}
              </Field>

              {/* 棟 */}
              <Field label="棟">
                <View style={[styles.chipRow, { flexWrap: "wrap", gap: 8 }]}>
                  {CLASSROOM_BUILDINGS.map(b => (
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
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.submit, { backgroundColor: canSubmit ? "#1A73E8" : "#E8EAED" }]}
            >
              <Text style={[styles.submitText, { color: canSubmit ? "white" : "#9AA0A6" }]}>
                {editing ? "保存する" : "追加する"}
              </Text>
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
  catalog: { marginBottom: 4 },
  catalogSearch: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#F1F3F4",
  },
  catalogInput: { flex: 1, fontSize: 14, color: "#202124", padding: 0 },
  catalogEmpty: { fontSize: 12, color: "#80868B", marginTop: 10 },
  catalogRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#F1F3F4",
  },
  catalogName: { fontSize: 14, fontWeight: "700", color: "#202124" },
  catalogMeta: { fontSize: 11, color: "#5F6368", marginTop: 1 },
  catalogConflict: { fontSize: 11, color: "#EA4335", marginTop: 2 },
  catalogAdd: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "#1A73E8",
  },
  catalogAddDisabled: { backgroundColor: "#F1F3F4" },
  catalogAddText: { fontSize: 13, fontWeight: "700", color: "white" },
  catalogAddDoneText: { fontSize: 12, fontWeight: "700", color: "#34A853" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E8EAED" },
  dividerText: { fontSize: 11, color: "#9AA0A6" },
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
