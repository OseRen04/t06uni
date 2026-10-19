import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Image,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react-native";
import type { Course } from "@/types";

type StepType = "entrance" | "elevator" | "classroom";

type Step = {
  id: StepType;
  label: string;
  desc: string;
  image: ImageSourcePropType;
  imageAlt: string;
  mapPoint: {
    x: number;
    y: number;
    label: string;
    note: string;
  };
};

const DESTINATION_ROOM = "104";
const DESTINATION_BUILDING = "学部棟";

type Room = { label: string; x: number; y: number; w: number; h: number; color: string; large?: boolean; target?: boolean };

const MAP_ROOMS: Room[] = [
  { label: "104", x: 7, y: 4, w: 10, h: 7, color: "#E8B7CB" },
  { label: "103", x: 22, y: 4, w: 11, h: 7, color: "#E8B7CB" },
  { label: "102", x: 22, y: 12, w: 11, h: 7, color: "#E8B7CB" },
  { label: "101\n情報科学\n講義室", x: 7, y: 24, w: 20, h: 17, color: "#E8B7CB", large: true },
  { label: "107", x: 50, y: 4, w: 16, h: 10, color: "#A9D4CF" },
  { label: "106\nB", x: 50, y: 24, w: 8, h: 8, color: "#A9D4CF" },
  { label: "106\nA", x: 58, y: 24, w: 8, h: 8, color: "#A9D4CF" },
  { label: "105", x: 50, y: 34, w: 8, h: 7, color: "#A9D4CF" },
  { label: "104", x: 58, y: 34, w: 8, h: 7, color: "#A9D4CF" },
  { label: "103\nB", x: 50, y: 41, w: 8, h: 7, color: "#A9D4CF" },
  { label: "103\nA", x: 58, y: 41, w: 8, h: 7, color: "#A9D4CF" },
  { label: "101\n数学第1\n講義室", x: 72, y: 10, w: 18, h: 16, color: "#A9D4CF", large: true },
  { label: "102", x: 72, y: 26, w: 18, h: 15, color: "#A9D4CF" },
  { label: "112", x: 26, y: 45, w: 14, h: 9, color: "#AFC4EA" },
  { label: "109", x: 26, y: 55, w: 14, h: 14, color: "#AFC4EA" },
  { label: "107\n12講義室", x: 26, y: 70, w: 14, h: 10, color: "#AFC4EA" },
  { label: "105", x: 11, y: 76, w: 15, h: 13, color: "#AFC4EA" },
  { label: "104\n11講義室", x: 11, y: 86, w: 30, h: 10, color: "#AFC4EA", target: true, large: true },
  { label: "120", x: 43, y: 46, w: 11, h: 8, color: "#AFC4EA" },
  { label: "119", x: 43, y: 58, w: 9, h: 5, color: "#AFC4EA" },
  { label: "130", x: 55, y: 58, w: 10, h: 4, color: "#AFC4EA" },
  { label: "125", x: 65, y: 58, w: 4, h: 4, color: "#AFC4EA" },
  { label: "126", x: 69, y: 58, w: 4, h: 4, color: "#AFC4EA" },
  { label: "133", x: 55, y: 63, w: 11, h: 12, color: "#AFC4EA" },
  { label: "132", x: 66, y: 63, w: 11, h: 10, color: "#AFC4EA" },
  { label: "135", x: 66, y: 74, w: 9, h: 6, color: "#AFC4EA" },
  { label: "141", x: 67, y: 81, w: 9, h: 7, color: "#AFC4EA" },
  { label: "142", x: 67, y: 88, w: 9, h: 9, color: "#AFC4EA" },
  { label: "160", x: 80, y: 46, w: 14, h: 9, color: "#AFC4EA" },
  { label: "159", x: 80, y: 55, w: 14, h: 11, color: "#AFC4EA" },
  { label: "157", x: 80, y: 66, w: 14, h: 10, color: "#AFC4EA" },
  { label: "156", x: 80, y: 76, w: 14, h: 8, color: "#AFC4EA" },
  { label: "154", x: 80, y: 84, w: 14, h: 6, color: "#AFC4EA" },
  { label: "151", x: 80, y: 90, w: 14, h: 12, color: "#AFC4EA" },
];

const ROUTE_SEGMENTS = [
  { x: 51.5, y: 78, w: 2.2, h: 18, activeFrom: 1 },
  { x: 41, y: 78, w: 11, h: 2.2, activeFrom: 2 },
  { x: 40, y: 80, w: 2.2, h: 7, activeFrom: 2 },
  { x: 35, y: 86, w: 7, h: 2.2, activeFrom: 2 },
];

const STEPS: Step[] = [
  {
    id: "entrance",
    label: "学部棟 正面玄関",
    desc: `${DESTINATION_BUILDING}の正面玄関から建物内に入ってください`,
    image: require("../../assets/genkan.png"),
    imageAlt: "学部棟 正面玄関",
    mapPoint: { x: 52.5, y: 96, label: "正面玄関", note: "入口" },
  },
  {
    id: "elevator",
    label: "エレベーター前",
    desc: "玄関を入って、案内表示のあるエレベーター前へ進んでください",
    image: require("../../assets/genkan02.png"),
    imageAlt: "エレベーター前",
    mapPoint: { x: 52.5, y: 77.5, label: "エレベーター前", note: "ロビー中央" },
  },
  {
    id: "classroom",
    label: `${DESTINATION_ROOM}講義室入口`,
    desc: `${DESTINATION_ROOM}講義室に到着です。入口を確認して入室してください`,
    image: require("../../assets/kougisitu.jpg"),
    imageAlt: `${DESTINATION_ROOM}講義室入口`,
    mapPoint: { x: 37, y: 86, label: `${DESTINATION_ROOM}講義室入口`, note: "目的地" },
  },
];

const pct = (n: number) => `${n}%` as DimensionValue;
const toPct = (v: Animated.Value) => v.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

function CurrentMarker({ step, stepIdx }: { step: Step; stepIdx: number }) {
  const x = useRef(new Animated.Value(step.mapPoint.x)).current;
  const y = useRef(new Animated.Value(step.mapPoint.y)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spring = { damping: 24, stiffness: 260, useNativeDriver: false };
    Animated.parallel([
      Animated.spring(x, { ...spring, toValue: step.mapPoint.x }),
      Animated.spring(y, { ...spring, toValue: step.mapPoint.y }),
    ]).start();
  }, [step, x, y]);

  useEffect(() => {
    const ease = Easing.inOut(Easing.ease);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: ease, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: ease, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.marker, { left: toPct(x), top: toPct(y) }]}>
      <Animated.View
        style={[
          styles.markerPulse,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.05] }) }],
          },
        ]}
      />
      <View style={styles.markerDot}>
        <Text style={styles.markerText}>{stepIdx + 1}</Text>
      </View>
    </Animated.View>
  );
}

function FloorPlan({ step, stepIdx }: { step: Step; stepIdx: number }) {
  return (
    <View style={styles.mapCard}>
      <View style={styles.map} accessibilityLabel={`1F フロアマップ 現在地 ${step.mapPoint.label}`}>
        <View style={styles.chip}>
          <Text style={styles.chipCaption}>現在地</Text>
          <Text style={styles.chipLabel}>{step.mapPoint.label}</Text>
          <Text style={styles.chipNote}>{step.mapPoint.note}</Text>
        </View>

        <Text style={styles.floorLabel}>1F</Text>
        <View style={[styles.corridor, { left: pct(4), top: pct(2), width: pct(30), height: pct(39) }]} />
        <View style={[styles.corridor, { left: pct(48), top: pct(2), width: pct(44), height: pct(46) }]} />
        <View style={[styles.corridor, { left: pct(21), top: pct(43), width: pct(74), height: pct(60) }]} />
        <View style={[styles.corridor, { left: pct(41), top: pct(82), width: pct(25), height: pct(20), backgroundColor: "#FBF7EF" }]} />

        {ROUTE_SEGMENTS.map((segment, i) => (
          <View
            key={i}
            style={[
              styles.routeSegment,
              stepIdx >= segment.activeFrom && styles.routeSegmentActive,
              { left: pct(segment.x), top: pct(segment.y), width: pct(segment.w), height: pct(segment.h) },
            ]}
          />
        ))}

        {MAP_ROOMS.map(room => (
          <View
            key={`${room.label}-${room.x}-${room.y}`}
            style={[
              styles.room,
              room.target && styles.roomTarget,
              { left: pct(room.x), top: pct(room.y), width: pct(room.w), height: pct(room.h), backgroundColor: room.color },
            ]}
          >
            <Text style={[styles.roomText, room.large && { fontSize: 8.5 }]}>{room.label}</Text>
          </View>
        ))}

        <View style={[styles.facility, styles.elevator, { left: pct(50), top: pct(76) }]}>
          <Text style={[styles.facilityText, { color: "#188038" }]}>EV</Text>
        </View>
        <View style={[styles.facility, styles.restroom, { left: pct(53), top: pct(76) }]}>
          <Text style={styles.facilityText}>WC</Text>
        </View>
        <View style={[styles.facility, styles.stairs, { left: pct(48), top: pct(91) }]}>
          <Text style={styles.facilityText}>階段</Text>
        </View>

        <Text style={styles.targetTag}>目的地 104講義室</Text>

        <CurrentMarker step={step} stepIdx={stepIdx} />
      </View>
    </View>
  );
}

// ステップが変わったときに中身をふわっと出す。key を変えて再マウントさせて使う
function Appear({ kind, children }: { kind: "slide" | "scale"; children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [v]);

  const transform =
    kind === "slide"
      ? [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }]
      : [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }];

  return <Animated.View style={{ opacity: v, transform }}>{children}</Animated.View>;
}

type Props = {
  course: Course;
  onBack: () => void;
};

export function FloorMap({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;

  const goTo = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStepIdx(i);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={onBack} style={styles.backButton} accessibilityLabel="キャンパスマップに戻る">
          <ArrowLeft size={18} color="#5F6368" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>{DESTINATION_BUILDING}　1F</Text>
          <Text style={styles.headerSubtitle}>{DESTINATION_ROOM}講義室への案内</Text>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Step progress dots */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>ステップ {stepIdx + 1} / {STEPS.length}</Text>
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === stepIdx ? 22 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    i < stepIdx ? "#34A853" :
                    i === stepIdx ? "#1A73E8" :
                    "#DADCE0",
                }}
              />
            ))}
          </View>
        </View>

        <FloorPlan step={step} stepIdx={stepIdx} />

        {/* Step description card */}
        <Appear key={step.id} kind="slide">
          <View style={styles.stepCard}>
            <Text style={styles.stepLabel}>{step.label}</Text>
            <Text style={styles.stepDesc}>{step.desc}</Text>
          </View>
        </Appear>

        <Appear key={`photo-${step.id}`} kind="scale">
          <View style={styles.photoCard}>
            <Image source={step.image} accessibilityLabel={step.imageAlt} style={styles.photo} resizeMode="cover" />
          </View>
        </Appear>
      </ScrollView>

      {/* Navigation footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        {isLast ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: "#34A853" }, pressed && styles.pressed]}
          >
            <CheckCircle2 size={20} color="white" />
            <Text style={[styles.primaryButtonText, { fontSize: 16 }]}>到着！完了</Text>
          </Pressable>
        ) : (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => !isFirst && goTo(stepIdx - 1)}
              disabled={isFirst}
              style={[styles.prevButton, { backgroundColor: isFirst ? "#F1F3F4" : "#E8F0FE" }]}
              accessibilityLabel="前のステップ"
            >
              <ChevronLeft size={22} color={isFirst ? "#9AA0A6" : "#1A73E8"} />
            </Pressable>
            <Pressable
              onPress={() => goTo(stepIdx + 1)}
              style={({ pressed }) => [styles.primaryButton, { flex: 1, backgroundColor: "#1A73E8" }, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>次へ進む</Text>
              <ChevronRight size={18} color="white" />
            </Pressable>
          </View>
        )}
      </View>
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, gap: 12 },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressText: { fontSize: 13, fontWeight: "700", color: "#1A73E8" },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },

  // フロア図(旧 floor-map.css)
  mapCard: {
    overflow: "hidden",
    borderWidth: 1, borderColor: "#DADCE0", borderRadius: 16,
    backgroundColor: "#fff",
  },
  map: { position: "relative", height: 360, overflow: "hidden", backgroundColor: "#F5F0E6" },
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
  routeSegment: {
    position: "absolute", zIndex: 5,
    borderRadius: 999,
    backgroundColor: "rgba(26, 115, 232, 0.18)",
  },
  routeSegmentActive: {
    backgroundColor: "#1A73E8",
    boxShadow: "0 0 0 3px rgba(26, 115, 232, 0.14)",
  },
  marker: {
    position: "absolute", zIndex: 10,
    width: 40, height: 40, marginLeft: -20, marginTop: -20,
    alignItems: "center", justifyContent: "center",
  },
  markerPulse: {
    position: "absolute", width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(26, 115, 232, 0.18)",
  },
  markerDot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 3, borderColor: "#fff",
    backgroundColor: "#1A73E8",
    alignItems: "center", justifyContent: "center",
    boxShadow: "0 3px 10px rgba(26, 115, 232, 0.45)",
  },
  markerText: { color: "#fff", fontSize: 11, fontWeight: "800", lineHeight: 13 },
  chip: {
    position: "absolute", left: 10, top: 10, zIndex: 12,
    minWidth: 132, gap: 1,
    paddingVertical: 8, paddingHorizontal: 10,
    borderWidth: 1, borderColor: "rgba(26, 115, 232, 0.25)", borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    boxShadow: "0 4px 14px rgba(60, 64, 67, 0.14)",
  },
  chipCaption: { color: "#1A73E8", fontSize: 10, fontWeight: "800" },
  chipLabel: { color: "#202124", fontSize: 13, fontWeight: "700", lineHeight: 16 },
  chipNote: { color: "#5F6368", fontSize: 10 },
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
  targetTag: {
    position: "absolute", left: "13.5%", top: "91.5%", zIndex: 9,
    paddingVertical: 4, paddingHorizontal: 8,
    borderRadius: 999, overflow: "hidden",
    backgroundColor: "#EA4335",
    color: "#fff", fontSize: 9, fontWeight: "800", lineHeight: 10,
  },

  stepCard: {
    backgroundColor: "white", borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: "#E8EAED",
  },
  stepLabel: { fontSize: 16, fontWeight: "700", color: "#202124" },
  stepDesc: { fontSize: 13, color: "#5F6368", marginTop: 5, lineHeight: 21 },
  photoCard: {
    overflow: "hidden",
    borderWidth: 1, borderColor: "#DADCE0", borderRadius: 16,
    backgroundColor: "#fff",
  },
  photo: { width: "100%", aspectRatio: 4 / 3, backgroundColor: "#E8EAED" },
  footer: {
    backgroundColor: "white",
    paddingHorizontal: 16, paddingTop: 12,
    boxShadow: "0 -1px 0 #E8EAED",
  },
  prevButton: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  primaryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 16,
  },
  primaryButtonText: { fontSize: 15, fontWeight: "700", color: "white" },
  pressed: { transform: [{ scale: 0.97 }] },
});
