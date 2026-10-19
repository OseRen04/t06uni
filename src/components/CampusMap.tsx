import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from "react-native-svg";
import { ArrowLeft, Clock, Footprints, MapPin, Navigation } from "lucide-react-native";
import type { Course } from "@/types";
import {
  CAMPUS_BUILDINGS, GATE, findBuilding, findRoute, routeToPath, walkMinutes, type Point,
} from "@/data/campus";
import { useCampusLocation, type LocationStatus } from "@/hooks/useCampusLocation";
import type { Destination } from "@/lib/destination";
import { formatRoom, formatSlotWithTime } from "@/lib/schedule";

const CARD_HEIGHT = 214;

// GPS の現在地が使えないとき、正門を起点にしている理由
const FALLBACK_REASON: Record<Exclude<LocationStatus, "ok">, string> = {
  loading: "現在地を取得中…",
  denied: "位置情報が許可されていないため正門から案内",
  outside: "キャンパスの外にいるため正門から案内",
  unconfigured: "キャンパスの位置が未設定のため正門から案内",
  error: "現在地を取得できないため正門から案内",
};

const TREES = [
  [44,44],[76,60],[312,36],[342,56],[362,42],
  [28,238],[52,272],[258,408],[288,432],[312,412],
  [68,438],[86,458],[170,530],[220,530],
];

// Animated.Value の現在値を state として受け取る。
// react-native-svg の要素は Animated.createAnimatedComponent だと Web で警告が出るため、値を state に流して再描画する
function useAnimatedNumber(anim: Animated.Value, initial: number) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const id = anim.addListener(({ value }) => setValue(value));
    return () => anim.removeListener(id);
  }, [anim]);
  return value;
}

function RouteLine({ d, length }: { d: string; length: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const t = useAnimatedNumber(progress, 0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1, duration: 1200, delay: 250,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [progress]);

  const common = {
    d, fill: "none", strokeLinecap: "round", strokeLinejoin: "round",
    strokeDasharray: [length, length], strokeDashoffset: length * (1 - t),
  } as const;

  return (
    <>
      <Path {...common} stroke="white" strokeWidth={9} opacity={0.55} />
      <Path {...common} stroke="#1A73E8" strokeWidth={5} />
    </>
  );
}

function Pin({ x, y }: { x: number; y: number }) {
  // ピンが上から落ちてくる動き
  const anim = useRef(new Animated.Value(0)).current;
  const t = useAnimatedNumber(anim, 0);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(1400),
      Animated.spring(anim, { toValue: 1, stiffness: 280, damping: 14, useNativeDriver: false }),
    ]).start();
  }, [anim]);

  return (
    <G opacity={Math.min(1, Math.max(0, t))} transform={`translate(0 ${-18 * (1 - t)})`}>
      <Ellipse cx={x} cy={y + 20} rx={7} ry={3.5} fill="rgba(0,0,0,0.18)" />
      <Path
        d={`M ${x} ${y + 18} C ${x - 9} ${y + 9} ${x - 11} ${y} ${x - 11} ${y - 3} A 11 11 0 1 1 ${x + 11} ${y - 3} C ${x + 11} ${y} ${x + 9} ${y + 9} ${x} ${y + 18} Z`}
        fill="#EA4335"
      />
      <Circle cx={x} cy={y - 3} r={4.5} fill="white" />
    </G>
  );
}

function CurrentLocation({ at, heading, label }: { at: Point; heading: number | null; label: string }) {
  const anim = useRef(new Animated.Value(18)).current;
  const r = useAnimatedNumber(anim, 18);
  const { x, y } = at;

  useEffect(() => {
    const ease = Easing.inOut(Easing.ease);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 28, duration: 1300, easing: ease, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 18, duration: 1300, easing: ease, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#4285F4" opacity={0.14} />
      {/* 向いている方角(地図は北が上なので、北 = 0° からそのまま回転させる) */}
      {heading !== null && (
        <Path
          d={`M ${x} ${y} L ${x - 13} ${y - 34} A 36 36 0 0 1 ${x + 13} ${y - 34} Z`}
          fill="#4285F4" opacity={0.3}
          transform={`rotate(${heading} ${x} ${y})`}
        />
      )}
      <Circle cx={x} cy={y} r={12} fill="#4285F4" opacity={0.22} />
      <Circle cx={x} cy={y} r={8} fill="#4285F4" stroke="white" strokeWidth={2.5} />
      <SvgText x={x} y={y + 20} textAnchor="middle" fontSize={9} fill="#4285F4" fontWeight="700">{label}</SvgText>
    </G>
  );
}

function Compass() {
  return (
    <G>
      <Circle cx={355} cy={85} r={24} fill="white" opacity={0.96} stroke="#DADCE0" strokeWidth={1.2} />
      {/* N — red */}
      <Polygon points="355,65 358.5,77 355,74 351.5,77" fill="#EA4335" />
      {/* S */}
      <Polygon points="355,105 358.5,93 355,96 351.5,93" fill="#9AA0A6" />
      {/* E */}
      <Polygon points="375,85 363,88.5 366,85 363,81.5" fill="#9AA0A6" />
      {/* W */}
      <Polygon points="335,85 347,88.5 344,85 347,81.5" fill="#9AA0A6" />
      <SvgText x={355} y={72} textAnchor="middle" fontSize={8} fontWeight="800" fill="#EA4335">N</SvgText>
      <SvgText x={355} y={102} textAnchor="middle" fontSize={7} fill="#9AA0A6">S</SvgText>
      <SvgText x={371} y={88} textAnchor="middle" fontSize={7} fill="#9AA0A6">E</SvgText>
      <SvgText x={339} y={88} textAnchor="middle" fontSize={7} fill="#9AA0A6">W</SvgText>
      <Circle cx={355} cy={85} r={3.5} fill="#5F6368" />
    </G>
  );
}

/** キャンパス自由検索から開いたときのカードの見出し(例: 「104号室」「学部棟」) */
const placeTitle = (d: Destination) => (d.roomNumber ? formatRoom(d.roomNumber) : d.building);

type Props = {
  destination: Destination;
  course?: Course;
  onBack: () => void;
  onEnterBuilding: () => void;
};

export function CampusMap({ destination, course, onBack, onEnterBuilding }: Props) {
  const insets = useSafeAreaInsets();
  const location = useCampusLocation();
  const bld = findBuilding(destination.building);
  const cardHeight = CARD_HEIGHT + insets.bottom;

  const usingGps = location.status === "ok" && location.point !== null;
  const start = usingGps ? location.point! : GATE;
  const route = useMemo(() => (bld ? findRoute(start, bld) : null), [bld, start.x, start.y]);
  const walk = route ? walkMinutes(route) : null;
  const walkText = walk === null ? "?" : String(walk);

  const roomText = [
    destination.floor !== undefined ? `${destination.floor}F` : "",
    destination.roomNumber && formatRoom(destination.roomNumber),
  ].filter(Boolean).join("　");

  return (
    <View style={styles.root}>
      {/* Full-screen map SVG。カードの角丸の裏まで地図を伸ばす */}
      <View style={[StyleSheet.absoluteFill, { bottom: cardHeight - 24 }]}>
        <Svg width="100%" height="100%" viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice">

          {/* Base ground */}
          <Rect width={390} height={560} fill="#E8EAED" />

          {/* Green areas */}
          <Rect x={8}   y={8}   width={96} height={86} rx={7} fill="#C8E6C9" opacity={0.92} />
          <Rect x={286} y={8}   width={96} height={86} rx={7} fill="#C8E6C9" opacity={0.92} />
          <Rect x={8}   y={215} width={66} height={95} rx={6} fill="#C8E6C9" opacity={0.80} />
          <Rect x={238} y={385} width={90} height={68} rx={6} fill="#C8E6C9" opacity={0.78} />
          <Rect x={52}  y={418} width={52} height={54} rx={4} fill="#C8E6C9" opacity={0.72} />

          {/* Trees */}
          {TREES.map(([cx, cy], i) => (
            <G key={i}>
              <Circle cx={cx} cy={cy} r={10} fill="#81C784" opacity={0.9} />
              <Circle cx={cx} cy={cy} r={6.5} fill="#66BB6A" opacity={0.75} />
            </G>
          ))}

          {/* Roads — white(経路探索の道路データ ROADS と同じ位置) */}
          {/* Main vertical */}
          <Rect x={182} y={0}   width={26}  height={560} fill="white" opacity={0.95} />
          {/* Upper horizontal */}
          <Rect x={0}   y={132} width={390} height={17}  fill="white" opacity={0.9} />
          {/* Middle horizontal */}
          <Rect x={0}   y={302} width={390} height={17}  fill="white" opacity={0.9} />
          {/* Lower horizontal */}
          <Rect x={0}   y={458} width={390} height={17}  fill="white" opacity={0.85} />
          {/* Left vertical */}
          <Rect x={109} y={132} width={16}  height={288} fill="white" opacity={0.9} />
          {/* Right vertical */}
          <Rect x={263} y={132} width={16}  height={198} fill="white" opacity={0.85} />

          {/* Road center dashes */}
          <Line x1={195} y1={0}   x2={195} y2={560} stroke="#FDD835" strokeWidth={1.2} strokeDasharray="10 8" opacity={0.45} />
          <Line x1={0}   y1={140} x2={390} y2={140} stroke="#FDD835" strokeWidth={1.2} strokeDasharray="10 8" opacity={0.45} />
          <Line x1={0}   y1={310} x2={390} y2={310} stroke="#FDD835" strokeWidth={1.2} strokeDasharray="10 8" opacity={0.45} />

          {/* Buildings */}
          {CAMPUS_BUILDINGS.map(b => {
            const isTarget = b.id === destination.building;
            const bgColor =
              isTarget         ? "#E8F0FE" :
              b.id === "食堂"  ? "#FFF8E1" :
              b.id === "体育館"? "#F3E5F5" :
              "#ECEFF1";
            const strokeColor =
              isTarget         ? "#1A73E8" :
              b.id === "食堂"  ? "#FFE082" :
              "#B0BEC5";

            return (
              <G key={b.id}>
                {isTarget && (
                  <Rect x={b.x - 3} y={b.y - 3} width={b.w + 6} height={b.h + 6} rx={7}
                    fill="#1A73E8" opacity={0.12} />
                )}
                <Rect x={b.x} y={b.y} width={b.w} height={b.h} rx={5}
                  fill={bgColor} stroke={strokeColor} strokeWidth={isTarget ? 2.5 : 1.5} />
                <SvgText
                  x={b.labelX} y={b.labelY}
                  textAnchor="middle" fontSize={isTarget ? 12 : 11}
                  fontWeight={isTarget ? "700" : "500"}
                  fill={isTarget ? "#1A73E8" : b.id === "食堂" ? "#F9A825" : "#546E7A"}
                >
                  {b.id}
                </SvgText>
              </G>
            );
          })}

          {/* 正門 */}
          <Rect x={174} y={498} width={42} height={22} rx={4} fill="#37474F" />
          <SvgText x={195} y={513} textAnchor="middle" fontSize={10} fill="white" fontWeight="700">正　門</SvgText>

          {/* Route — 現在地(使えないときは正門)から目的の建物の入口まで */}
          {route && <RouteLine key={bld!.id} d={routeToPath(route)} length={route.length} />}

          {/* Destination pin */}
          {bld && <Pin x={bld.pinX} y={bld.pinY} />}

          {/* 現在地 */}
          <CurrentLocation at={start} heading={location.heading} label={usingGps ? "現在地" : "正門(仮の現在地)"} />

          {/* Compass */}
          <Compass />
        </Svg>
      </View>

      {/* Top search bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={onBack} style={styles.backButton} accessibilityLabel="戻る">
          <ArrowLeft size={20} color="#202124" />
        </Pressable>
        <View style={styles.destination}>
          <MapPin size={14} color="#EA4335" />
          <View style={{ flex: 1 }}>
            <Text style={styles.destinationName}>{destination.building}</Text>
            <Text style={styles.destinationMeta}>
              {usingGps ? "現在地" : "正門"}から徒歩約{walkText}分
            </Text>
            {!usingGps && location.status !== "ok" && (
              <Text style={styles.fallbackNote}>{FALLBACK_REASON[location.status]}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Bottom card */}
      <View style={[styles.card, { height: cardHeight }]}>
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* Course name / place name + tags */}
          <Text style={styles.courseName} numberOfLines={1}>{course ? course.name : placeTitle(destination)}</Text>
          <View style={styles.tagRow}>
            <Text style={styles.buildingTag}>{destination.building}</Text>
            {roomText !== "" && <Text style={styles.room}>{roomText}</Text>}
          </View>

          {/* Info row */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Footprints size={13} color="#1A73E8" />
              <Text style={styles.walk}>徒歩{walkText}分</Text>
            </View>
            {course && (
              <View style={styles.infoItem}>
                <Clock size={13} color="#80868B" />
                <Text style={styles.time}>{formatSlotWithTime(course.day, course.period)}</Text>
              </View>
            )}
          </View>

          {/* Enter building button */}
          <Pressable
            onPress={onEnterBuilding}
            style={({ pressed }) => [styles.enterButton, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <Navigation size={17} color="white" />
            <Text style={styles.enterButtonText}>建物に入る → フロアマップ</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#E8EAED" },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "white", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
  },
  destination: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "white", borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
  },
  destinationName: { fontSize: 14, fontWeight: "600", color: "#202124" },
  destinationMeta: { fontSize: 11, color: "#80868B" },
  fallbackNote: { fontSize: 10, color: "#E37400", marginTop: 1 },
  card: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    boxShadow: "0 -2px 20px rgba(0,0,0,0.15)",
  },
  handleRow: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB" },
  courseName: { fontSize: 19, fontWeight: "700", color: "#202124", lineHeight: 25 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  buildingTag: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: "hidden",
    fontSize: 11, fontWeight: "600", backgroundColor: "#E8F0FE", color: "#1A73E8",
  },
  room: { fontSize: 13, color: "#5F6368" },
  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 16,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: "#E8EAED",
  },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  walk: { fontSize: 12, color: "#1A73E8", fontWeight: "600" },
  time: { fontSize: 12, color: "#5F6368" },
  enterButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 12, paddingVertical: 14, borderRadius: 16,
    backgroundColor: "#1A73E8",
  },
  enterButtonText: { fontSize: 15, fontWeight: "700", color: "white" },
});
