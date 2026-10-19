import { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type DimensionValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { ArrowLeft, Clock, MapPinOff } from "lucide-react-native";
import type { Course } from "@/types";
import { findFloorPlan, findRoom, roomLabel, type Facility, type FloorPlan, type FloorRoom } from "@/data/floorPlans";
import type { Destination } from "@/lib/destination";
import { formatSlotWithTime } from "@/lib/schedule";

const pct = (n: number) => `${n}%` as DimensionValue;

const FACILITY_LABEL: Record<Facility["kind"], string> = { elevator: "EV", restroom: "WC", stairs: "階段" };

/**
 * 目的の教室に立てるピン。教室番号の文字を隠さないよう、先端を教室の上辺の中央に置く。
 * 図の上端に近い教室だけは、ピンがはみ出さないよう教室の中央に置く
 */
function RoomPin({ room }: { room: FloorRoom }) {
  const drop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    drop.setValue(0);
    Animated.spring(drop, { toValue: 1, stiffness: 280, damping: 14, useNativeDriver: true }).start();
  }, [drop, room.id]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pin,
        {
          left: pct(room.x + room.w / 2),
          top: pct(room.y < 12 ? room.y + room.h / 2 : room.y),
          opacity: drop,
          transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        },
      ]}
    >
      <Svg width={30} height={40} viewBox="0 0 30 40">
        <Ellipse cx={15} cy={38} rx={6} ry={2.5} fill="rgba(0,0,0,0.22)" />
        <Path
          d="M 15 37 C 6 27 3 20 3 14 A 12 12 0 1 1 27 14 C 27 20 24 27 15 37 Z"
          fill="#EA4335" stroke="white" strokeWidth={1.5}
        />
        <Circle cx={15} cy={14} r={4.5} fill="white" />
      </Svg>
    </Animated.View>
  );
}

function FloorPlanView({ plan, target }: { plan: FloorPlan; target?: FloorRoom }) {
  return (
    <View style={styles.mapCard}>
      <View style={styles.map} accessibilityLabel={`${plan.building} ${plan.floor}F フロアマップ`}>
        <Text style={styles.floorLabel}>{plan.floor}F</Text>

        {plan.corridors.map((c, i) => (
          <View
            key={i}
            style={[styles.corridor, { left: pct(c.x), top: pct(c.y), width: pct(c.w), height: pct(c.h) }, c.color && { backgroundColor: c.color }]}
          />
        ))}

        {plan.rooms.map(room => {
          const isTarget = room.id === target?.id;
          return (
            <View
              key={room.id}
              style={[
                styles.room,
                isTarget && styles.roomTarget,
                { left: pct(room.x), top: pct(room.y), width: pct(room.w), height: pct(room.h), backgroundColor: room.color },
              ]}
            >
              <Text style={[styles.roomText, room.name && { fontSize: 8.5 }]}>{roomLabel(room)}</Text>
            </View>
          );
        })}

        {plan.facilities.map((f, i) => (
          <View key={i} style={[styles.facility, styles[f.kind], { left: pct(f.x), top: pct(f.y) }]}>
            <Text style={[styles.facilityText, f.kind === "elevator" && { color: "#188038" }]}>{FACILITY_LABEL[f.kind]}</Text>
          </View>
        ))}

        {target && <RoomPin room={target} />}
      </View>
    </View>
  );
}

type Props = {
  destination: Destination;
  course?: Course;
  onBack: () => void;
};

export function FloorMap({ destination, course, onBack }: Props) {
  const insets = useSafeAreaInsets();
  // 階が分からない(棟だけを検索した)ときは 1F を表示する
  const floor = destination.floor ?? 1;
  const plan = findFloorPlan(destination.building, floor);
  const target = plan ? findRoom(plan, destination.roomNumber, destination.roomId) : undefined;
  const roomText = destination.roomNumber
    ? (/^[\dA-Z]+$/i.test(destination.roomNumber) ? `${destination.roomNumber}号室` : destination.roomNumber)
    : undefined;

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
        {plan ? (
          <>
            <FloorPlanView plan={plan} target={target} />
            {roomText && !target && (
              <View style={styles.notice}>
                <MapPinOff size={16} color="#E37400" />
                <Text style={styles.noticeText}>{roomText}はこのフロアマップに載っていません</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noPlan}>
            <MapPinOff size={28} color="#9AA0A6" />
            <Text style={styles.noPlanTitle}>{destination.building} {floor}F のフロアマップは準備中です</Text>
            <Text style={styles.noPlanText}>
              {roomText ? `${roomText}は${destination.building}の${floor}階にあります。` : ""}
              現在フロアマップがあるのは学部棟 1F だけです。
            </Text>
          </View>
        )}

        {/* 行き先の情報 */}
        {(course || roomText) && (
          <View style={styles.infoCard}>
            {course && <Text style={styles.infoTitle}>{course.name}</Text>}
            <Text style={styles.infoLocation}>
              {destination.building} {floor}F{roomText ? ` ${roomText}` : ""}
              {target?.name ? `(${target.name})` : ""}
            </Text>
            {course && (
              <View style={styles.infoTime}>
                <Clock size={13} color="#80868B" />
                <Text style={styles.infoTimeText}>{formatSlotWithTime(course.day, course.period)}</Text>
              </View>
            )}
          </View>
        )}
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

  // フロア図
  mapCard: {
    overflow: "hidden",
    borderWidth: 1, borderColor: "#DADCE0", borderRadius: 16,
    backgroundColor: "#fff",
  },
  map: { position: "relative", aspectRatio: 0.85, overflow: "hidden", backgroundColor: "#F5F0E6" },
  corridor: {
    position: "absolute",
    borderWidth: 1, borderColor: "rgba(95, 99, 104, 0.35)",
    backgroundColor: "#F8F4EA",
  },
  room: {
    position: "absolute", zIndex: 3,
    alignItems: "center", justifyContent: "center",
    padding: 2,
    borderWidth: 1.4, borderColor: "rgba(32, 33, 36, 0.75)",
  },
  roomText: { color: "#243044", fontSize: 8, fontWeight: "700", lineHeight: 8.5, textAlign: "center" },
  roomTarget: {
    zIndex: 6,
    borderWidth: 2, borderColor: "#EA4335",
    boxShadow: "0 0 0 3px rgba(234, 67, 53, 0.18)",
  },
  pin: { position: "absolute", zIndex: 11, width: 30, height: 40, marginLeft: -15, marginTop: -37 },
  floorLabel: {
    position: "absolute", left: 7, bottom: 5, zIndex: 2,
    color: "#283593", fontSize: 34, fontWeight: "900", lineHeight: 34,
  },
  facility: {
    position: "absolute", zIndex: 7,
    alignItems: "center", justifyContent: "center",
    borderRadius: 4, borderWidth: 1,
    backgroundColor: "#fff",
  },
  facilityText: { fontSize: 7, fontWeight: "800", color: "#5F6368" },
  elevator: { width: 22, height: 18, marginLeft: -11, marginTop: -9, borderColor: "#34A853", backgroundColor: "#E6F4EA" },
  restroom: { width: 22, height: 18, marginLeft: -11, marginTop: -9, borderColor: "#5F6368" },
  stairs: { width: 34, height: 16, marginLeft: -17, marginTop: -8, borderColor: "#9AA0A6" },

  notice: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 12, backgroundColor: "#FEF7E0",
  },
  noticeText: { flex: 1, fontSize: 13, color: "#7A4F01" },
  noPlan: {
    alignItems: "center", gap: 8,
    paddingVertical: 40, paddingHorizontal: 20,
    borderRadius: 16, borderWidth: 1, borderColor: "#E8EAED", backgroundColor: "white",
  },
  noPlanTitle: { fontSize: 15, fontWeight: "700", color: "#202124", textAlign: "center" },
  noPlanText: { fontSize: 13, color: "#5F6368", textAlign: "center", lineHeight: 20 },
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
