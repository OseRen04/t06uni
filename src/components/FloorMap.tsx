import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Clock } from "lucide-react-native";
import type { Course } from "@/types";
import type { Destination } from "@/lib/destination";
import { formatRoom, formatSlotWithTime } from "@/lib/schedule";

type Props = {
  destination: Destination;
  course?: Course;
  onBack: () => void;
};

export function FloorMap({ destination, course, onBack }: Props) {
  const insets = useSafeAreaInsets();
  // 階が分からない(棟だけを検索した)ときは 1F を表示する
  const floor = destination.floor ?? 1;
  const roomText = destination.roomNumber ? formatRoom(destination.roomNumber) : undefined;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={onBack} style={styles.backButton} accessibilityLabel="キャンパスマップに戻る">
          <ArrowLeft size={18} color="#5F6368" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{destination.building}　{floor}F</Text>
          <Text style={styles.headerSubtitle}>{roomText ? `${roomText}の場所` : "フロアマップ"}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        {/* フロアマップのデータがまだないため、表示位置だけ確保しておく */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>ここにフロアマップを表示</Text>
          <Text style={styles.placeholderNote}>
            {destination.building} {floor}F の図{roomText ? `と、${roomText}のピン` : ""}
          </Text>
        </View>

        {/* 行き先の情報 */}
        <View style={styles.infoCard}>
          {course && <Text style={styles.infoTitle}>{course.name}</Text>}
          <Text style={styles.infoLocation}>
            {destination.building} {floor}F{roomText ? ` ${roomText}` : ""}
          </Text>
          {course && (
            <View style={styles.infoTime}>
              <Clock size={13} color="#80868B" />
              <Text style={styles.infoTimeText}>{formatSlotWithTime(course.day, course.period)}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "white",
    paddingBottom: 12, paddingHorizontal: 16,
    boxShadow: "0 1px 0 #E8EAED",
    zIndex: 1,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#202124" },
  headerSubtitle: { fontSize: 12, color: "#80868B" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  placeholder: {
    aspectRatio: 0.85,
    alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 16, borderWidth: 2, borderStyle: "dashed", borderColor: "#BDC1C6",
    backgroundColor: "#F1F3F4",
  },
  placeholderText: { fontSize: 18, fontWeight: "700", color: "#5F6368" },
  placeholderNote: { fontSize: 12, color: "#80868B" },
  infoCard: {
    backgroundColor: "white", borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: "#E8EAED",
    gap: 4,
  },
  infoTitle: { fontSize: 16, fontWeight: "700", color: "#202124" },
  infoLocation: { fontSize: 13, color: "#5F6368" },
  infoTime: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  infoTimeText: { fontSize: 12, color: "#5F6368" },
});
