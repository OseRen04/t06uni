import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Building2, MapPin, Plus, Search, X } from "lucide-react-native";
import type { Course, NewCourse } from "@/types";
import { searchPlaces, type Place } from "@/data/places";
import { DAYS, PERIODS, formatLocation, formatSlot } from "@/lib/schedule";
import { matchesQuery, tokenize } from "@/lib/search";
import { CourseFormModal } from "./CourseFormModal";

type Props = {
  courses: Course[];
  onSelectCourse: (c: Course) => void;
  onSelectPlace: (p: Place) => void;
  onAddCourse: (data: NewCourse) => void;
  onUpdateCourse: (id: string, data: NewCourse) => void;
  onDeleteCourse: (id: string) => void;
};

// 講義の追加・編集モーダルの状態。editing は編集中の講義
type FormState = { mode: "add" } | { mode: "edit"; editing: Course } | null;

export function Timetable({ courses, onSelectCourse, onSelectPlace, onAddCourse, onUpdateCourse, onDeleteCourse }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<FormState>(null);

  const tokens = tokenize(search);
  const searching = tokens.length > 0;
  // 登録済みの講義:授業名・曜日・時限・教員名・教室・棟で検索
  const courseResults = searching
    ? courses.filter(c =>
        matchesQuery(tokens, { texts: [c.name, c.professor, c.roomNumber, c.building], day: c.day, period: c.period })
      )
    : [];
  // キャンパス自由検索:教室名・棟の名前で検索
  const placeResults = searching ? searchPlaces(search) : [];

  const getCourse = (day: number, period: number) =>
    courses.find(c => c.day === day && c.period === period);

  const clearSearch = () => setSearch("");

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>時間割</Text>
            <Text style={styles.subtitle}>2026年度 前期</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setEditMode(e => !e)}
              style={[styles.editButton, { backgroundColor: editMode ? "#EA4335" : "#F1F3F4" }]}
            >
              <Text style={[styles.editButtonText, { color: editMode ? "white" : "#5F6368" }]}>
                {editMode ? "完了" : "編集"}
              </Text>
            </Pressable>
            <Pressable onPress={() => setForm({ mode: "add" })} style={styles.addButton} accessibilityLabel="講義を追加">
              <Plus size={18} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Search size={14} color="#80868B" />
          <TextInput
            placeholder="講義名・曜日・時限・教員・教室・棟で検索"
            placeholderTextColor="#9AA0A6"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search !== "" && (
            <Pressable onPress={clearSearch} hitSlop={8} accessibilityLabel="検索をクリア">
              <X size={14} color="#80868B" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Search results */}
      {searching && (
        <ScrollView style={styles.results} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
          {courseResults.length === 0 && placeResults.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>「{search.trim()}」に一致する講義・場所なし</Text>
            </View>
          ) : (
            <>
              {courseResults.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>登録済みの講義 {courseResults.length}件</Text>
                  {courseResults.map(c => (
                    <Pressable
                      key={c.id}
                      onPress={() => { clearSearch(); onSelectCourse(c); }}
                      style={({ pressed }) => [styles.resultRow, pressed && styles.resultPressed]}
                    >
                      <View style={[styles.resultDot, { backgroundColor: c.color }]} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.resultName} numberOfLines={1}>{c.name}</Text>
                        <Text style={styles.resultMeta}>
                          {formatSlot(c.day, c.period)}　{formatLocation(c)}{c.professor ? `　${c.professor}` : ""}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </>
              )}

              {placeResults.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>キャンパス内の場所 {placeResults.length}件</Text>
                  {placeResults.map(p => (
                    <Pressable
                      key={p.key}
                      onPress={() => { clearSearch(); onSelectPlace(p); }}
                      style={({ pressed }) => [styles.resultRow, pressed && styles.resultPressed]}
                    >
                      {p.roomNumber ? <MapPin size={16} color="#EA4335" /> : <Building2 size={16} color="#1A73E8" />}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.resultName} numberOfLines={1}>{p.title}</Text>
                        <Text style={styles.resultMeta}>
                          {p.roomNumber ? `${p.building} ${p.floor}F${p.area ? ` ${p.area}` : ""}` : "建物"}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Timetable grid */}
      {!searching && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 16 }]}
          stickyHeaderIndices={[0]}
        >
          {/* Day headers */}
          <View style={styles.dayHeader}>
            <View style={styles.periodColumn} />
            {DAYS.map(d => (
              <Text key={d} style={styles.dayHeaderText}>{d}</Text>
            ))}
          </View>

          {editMode && (
            <Text style={styles.editHint}>講義をタップすると内容を編集、×で削除できます</Text>
          )}

          {/* Period rows */}
          {PERIODS.map((p, pi) => (
            // 1限の行だけ、編集モードの削除バッジが固定ヘッダーに隠れないよう上に余白を取る
            <View key={p.period} style={[styles.periodRow, pi === 0 && { marginTop: 6 }]}>
              {/* Period label */}
              <View style={[styles.periodColumn, styles.periodLabel]}>
                <Text style={styles.periodNumber}>{p.period}</Text>
                <Text style={styles.periodTime}>{p.start}</Text>
                <Text style={styles.periodTime}>{p.end}</Text>
              </View>

              {/* Day cells */}
              {DAYS.map((_, di) => {
                const c = getCourse(di, p.period);
                return (
                  <View key={di} style={styles.cell}>
                    {c ? (
                      <View style={{ flex: 1 }}>
                        <Pressable
                          onPress={() => (editMode ? setForm({ mode: "edit", editing: c }) : onSelectCourse(c))}
                          style={({ pressed }) => [
                            styles.courseCard,
                            { backgroundColor: c.color },
                            pressed && { transform: [{ scale: 0.95 }] },
                          ]}
                          accessibilityLabel={editMode ? `${c.name}を編集` : c.name}
                        >
                          <Text style={styles.courseName}>{c.name}</Text>
                          <View>
                            <Text style={styles.courseMeta}>{c.building} {c.floor}F</Text>
                            <Text style={styles.courseMeta}>{c.roomNumber}号室</Text>
                          </View>
                        </Pressable>

                        {/* Delete badge in edit mode */}
                        {editMode && (
                          <Pressable
                            onPress={() => onDeleteCourse(c.id)}
                            style={styles.deleteBadge}
                            hitSlop={6}
                            accessibilityLabel={`${c.name}を削除`}
                          >
                            <X size={10} color="white" strokeWidth={3} />
                          </Pressable>
                        )}
                      </View>
                    ) : (
                      <View style={styles.emptyCell} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

      {form && (
        <CourseFormModal
          existingCourses={courses}
          editing={form.mode === "edit" ? form.editing : undefined}
          onSubmit={data => {
            if (form.mode === "edit") onUpdateCourse(form.editing.id, data);
            else onAddCourse(data);
            setForm(null);
          }}
          onClose={() => setForm(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "white",
    paddingBottom: 12,
    paddingHorizontal: 16,
    boxShadow: "0 1px 0 #E8EAED",
    zIndex: 1,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "700", color: "#202124" },
  subtitle: { fontSize: 11, color: "#80868B" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  editButtonText: { fontSize: 13, fontWeight: "600" },
  addButton: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#1A73E8",
  },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#F1F3F4",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#202124", padding: 0 },
  results: { flex: 1, backgroundColor: "white" },
  noResults: { height: 160, alignItems: "center", justifyContent: "center" },
  noResultsText: { fontSize: 15, color: "#80868B" },
  sectionTitle: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
    fontSize: 12, color: "#80868B", fontWeight: "700",
    backgroundColor: "#F9FAFB",
  },
  resultRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F1F3F4",
  },
  resultPressed: { backgroundColor: "#F8F9FA" },
  resultDot: { width: 12, height: 12, borderRadius: 6, marginHorizontal: 2 },
  resultName: { fontSize: 15, fontWeight: "600", color: "#202124" },
  resultMeta: { fontSize: 11, color: "#80868B", marginTop: 1 },
  grid: { paddingHorizontal: 8 },
  dayHeader: { flexDirection: "row", backgroundColor: "#F9FAFB", paddingTop: 8, paddingBottom: 4 },
  dayHeaderText: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "600", color: "#5F6368" },
  editHint: { fontSize: 11, color: "#EA4335", textAlign: "center", marginTop: 2 },
  periodColumn: { width: 38 },
  periodRow: { flexDirection: "row", alignItems: "stretch", marginBottom: 4 },
  periodLabel: { alignItems: "center", justifyContent: "center", paddingRight: 4 },
  periodNumber: { fontSize: 15, fontWeight: "700", color: "#5F6368" },
  periodTime: { fontSize: 8, color: "#9AA0A6" },
  cell: { flex: 1, paddingHorizontal: 2, minHeight: 72 },
  courseCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 12,
    padding: 6,
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  courseName: { fontSize: 10, fontWeight: "600", color: "#1F2937", lineHeight: 13 },
  courseMeta: { fontSize: 8, color: "#374151" },
  deleteBadge: {
    position: "absolute", top: -6, right: -6, zIndex: 10,
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#EA4335",
  },
  emptyCell: {
    flex: 1, minHeight: 72, borderRadius: 12,
    backgroundColor: "white", borderWidth: 1, borderColor: "#F3F4F6",
  },
});
