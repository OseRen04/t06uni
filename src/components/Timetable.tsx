import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Search, X } from "lucide-react-native";
import type { Course, NewCourse } from "@/types";
import { AddCourseModal } from "./AddCourseModal";

const DAYS = ["月", "火", "水", "木", "金"];
const PERIODS = [
  { n: "1", time: ["8:50", "10:20"] },
  { n: "2", time: ["10:30", "12:00"] },
  { n: "3", time: ["13:00", "14:30"] },
  { n: "4", time: ["14:40", "16:10"] },
  { n: "5", time: ["16:20", "17:50"] },
];

type Props = {
  courses: Course[];
  onSelectCourse: (c: Course) => void;
  onDeleteCourse: (id: string) => void;
  onAddCourse: (data: NewCourse) => void;
};

export function Timetable({ courses, onSelectCourse, onDeleteCourse, onAddCourse }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const q = search.trim().toLowerCase();
  const searchResults = q
    ? courses.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.roomNumber.toLowerCase().includes(q) ||
        c.building.toLowerCase().includes(q) ||
        c.professor.toLowerCase().includes(q)
      )
    : [];

  const getCourse = (day: number, period: number) =>
    courses.find(c => c.day === day && c.period === period);

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
            <Pressable onPress={() => setShowAdd(true)} style={styles.addButton} accessibilityLabel="講義を追加">
              <Plus size={18} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Search size={14} color="#80868B" />
          <TextInput
            placeholder="講義名・教室・棟で検索"
            placeholderTextColor="#9AA0A6"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search !== "" && (
            <Pressable onPress={() => setSearch("")} hitSlop={8} accessibilityLabel="検索をクリア">
              <X size={14} color="#80868B" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Search results list */}
      {q !== "" && (
        <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
          {searchResults.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>「{search}」に一致する講義なし</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.resultCount}>{searchResults.length}件</Text>
              {searchResults.map(c => (
                <Pressable
                  key={c.id}
                  onPress={() => { setSearch(""); onSelectCourse(c); }}
                  style={({ pressed }) => [styles.resultRow, pressed && { backgroundColor: "#F8F9FA" }]}
                >
                  <View style={[styles.resultDot, { backgroundColor: c.color }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.resultName} numberOfLines={1}>{c.name}</Text>
                    <Text style={styles.resultMeta}>
                      {DAYS[c.day]}曜 {c.period}限　{c.building} {c.floor}F {c.roomNumber}号室
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Timetable grid */}
      {q === "" && (
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

          {/* Period rows */}
          {PERIODS.map((p, pi) => (
            // 1限の行だけ、編集モードの削除バッジが固定ヘッダーに隠れないよう上に余白を取る
            <View key={pi} style={[styles.periodRow, pi === 0 && { marginTop: 6 }]}>
              {/* Period label */}
              <View style={[styles.periodColumn, styles.periodLabel]}>
                <Text style={styles.periodNumber}>{p.n}</Text>
                {p.time.map(t => (
                  <Text key={t} style={styles.periodTime}>{t}</Text>
                ))}
              </View>

              {/* Day cells */}
              {DAYS.map((_, di) => {
                const c = getCourse(di, pi + 1);
                return (
                  <View key={di} style={styles.cell}>
                    {c ? (
                      <View style={{ flex: 1 }}>
                        <Pressable
                          onPress={() => !editMode && onSelectCourse(c)}
                          style={({ pressed }) => [
                            styles.courseCard,
                            { backgroundColor: c.color },
                            pressed && !editMode && { transform: [{ scale: 0.95 }] },
                          ]}
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

      {showAdd && (
        <AddCourseModal
          existingCourses={courses}
          onAdd={data => { onAddCourse(data); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
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
  resultCount: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, fontSize: 12, color: "#80868B", fontWeight: "600" },
  resultRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F1F3F4",
  },
  resultDot: { width: 12, height: 12, borderRadius: 6 },
  resultName: { fontSize: 15, fontWeight: "600", color: "#202124" },
  resultMeta: { fontSize: 11, color: "#80868B" },
  grid: { paddingHorizontal: 8 },
  dayHeader: { flexDirection: "row", backgroundColor: "#F9FAFB", paddingTop: 8, paddingBottom: 4 },
  dayHeaderText: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "600", color: "#5F6368" },
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
