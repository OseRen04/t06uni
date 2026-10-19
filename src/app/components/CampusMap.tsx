import { useMemo } from "react";
import { motion } from "motion/react";
import { ArrowLeft, MapPin, Clock, Navigation, Footprints, Compass as CompassIcon } from "lucide-react";
import type { Course, Destination } from "../types";
import {
  CAMPUS_BUILDINGS, GATE, findBuilding, findRoute, routeToPath, walkMinutes, type Point,
} from "../data/campus";
import { useCampusLocation, type LocationStatus } from "../hooks/useCampusLocation";
import { formatRoom, formatSlotWithTime } from "../lib/schedule";

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

function Pin({ x, y }: { x: number; y: number }) {
  return (
    <motion.g
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.4, type: "spring", stiffness: 280, damping: 14 }}
      style={{ transformOrigin: `${x}px ${y + 18}px` }}
    >
      <ellipse cx={x} cy={y + 20} rx="7" ry="3.5" fill="rgba(0,0,0,0.18)" />
      <path
        d={`M ${x} ${y + 18} C ${x - 9} ${y + 9} ${x - 11} ${y} ${x - 11} ${y - 3} A 11 11 0 1 1 ${x + 11} ${y - 3} C ${x + 11} ${y} ${x + 9} ${y + 9} ${x} ${y + 18} Z`}
        fill="#EA4335"
      />
      <circle cx={x} cy={y - 3} r="4.5" fill="white" />
    </motion.g>
  );
}

function CurrentLocation({ at, heading, label }: { at: Point; heading: number | null; label: string }) {
  const { x, y } = at;
  return (
    <g>
      <motion.circle
        cx={x} cy={y} r="22" fill="#4285F4" opacity="0.14"
        animate={{ r: [18, 28, 18] }}
        transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
      />
      {/* 向いている方角(地図は北が上なので、北 = 0° からそのまま回転させる) */}
      {heading !== null && (
        <path
          d={`M ${x} ${y} L ${x - 13} ${y - 34} A 36 36 0 0 1 ${x + 13} ${y - 34} Z`}
          fill="#4285F4" opacity="0.3"
          transform={`rotate(${heading} ${x} ${y})`}
        />
      )}
      <circle cx={x} cy={y} r="12" fill="#4285F4" opacity="0.22" />
      <circle cx={x} cy={y} r="8" fill="#4285F4" stroke="white" strokeWidth="2.5" />
      <text x={x} y={y + 20} textAnchor="middle" fontSize="9" fill="#4285F4" fontWeight="700">{label}</text>
    </g>
  );
}

function Compass() {
  return (
    <g>
      <circle cx="355" cy="85" r="24" fill="white" opacity="0.96" stroke="#DADCE0" strokeWidth="1.2" />
      {/* N — red */}
      <polygon points="355,65 358.5,77 355,74 351.5,77" fill="#EA4335" />
      {/* S */}
      <polygon points="355,105 358.5,93 355,96 351.5,93" fill="#9AA0A6" />
      {/* E */}
      <polygon points="375,85 363,88.5 366,85 363,81.5" fill="#9AA0A6" />
      {/* W */}
      <polygon points="335,85 347,88.5 344,85 347,81.5" fill="#9AA0A6" />
      <text x="355" y="72" textAnchor="middle" fontSize="8" fontWeight="800" fill="#EA4335">N</text>
      <text x="355" y="102" textAnchor="middle" fontSize="7" fill="#9AA0A6">S</text>
      <text x="371" y="88" textAnchor="middle" fontSize="7" fill="#9AA0A6">E</text>
      <text x="339" y="88" textAnchor="middle" fontSize="7" fill="#9AA0A6">W</text>
      <circle cx="355" cy="85" r="3.5" fill="#5F6368" />
    </g>
  );
}

type Props = {
  destination: Destination;
  course?: Course;
  onBack: () => void;
  onEnterBuilding: () => void;
};

export function CampusMap({ destination, course, onBack, onEnterBuilding }: Props) {
  const location = useCampusLocation();
  const bld = findBuilding(destination.building);

  const usingGps = location.status === "ok" && location.point !== null;
  const start = usingGps ? location.point! : GATE;
  const route = useMemo(() => (bld ? findRoute(start, bld) : null), [bld, start.x, start.y]);
  const walkText = route ? String(walkMinutes(route)) : "?";

  // 講義から開いたときは講義名、キャンパス自由検索から開いたときは教室名か棟名を見出しにする
  const title = course ? course.name : destination.roomNumber ? formatRoom(destination.roomNumber) : destination.building;
  const roomText = [
    destination.floor !== undefined ? `${destination.floor}F` : "",
    destination.roomNumber ? formatRoom(destination.roomNumber) : "",
  ].filter(Boolean).join("　");

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
    >
      {/* Full-screen map SVG */}
      <div className="absolute inset-0" style={{ bottom: 214 }}>
        <svg viewBox="0 0 390 560" className="w-full h-full" preserveAspectRatio="xMidYMid slice">

          {/* Base ground */}
          <rect width="390" height="560" fill="#E8EAED" />

          {/* Green areas */}
          <rect x="8"   y="8"   width="96"  height="86"  rx="7" fill="#C8E6C9" opacity="0.92" />
          <rect x="286" y="8"   width="96"  height="86"  rx="7" fill="#C8E6C9" opacity="0.92" />
          <rect x="8"   y="215" width="66"  height="95"  rx="6" fill="#C8E6C9" opacity="0.80" />
          <rect x="238" y="385" width="90"  height="68"  rx="6" fill="#C8E6C9" opacity="0.78" />
          <rect x="52"  y="418" width="52"  height="54"  rx="4" fill="#C8E6C9" opacity="0.72" />

          {/* Trees */}
          {TREES.map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="10" fill="#81C784" opacity="0.9" />
              <circle cx={cx} cy={cy} r="6.5" fill="#66BB6A" opacity="0.75" />
            </g>
          ))}

          {/* Roads — white(経路探索の道路データ ROADS と同じ位置) */}
          {/* Main vertical */}
          <rect x="182" y="0"   width="26"  height="560" fill="white" opacity="0.95" />
          {/* Upper horizontal */}
          <rect x="0"   y="132" width="390" height="17"  fill="white" opacity="0.9" />
          {/* Middle horizontal */}
          <rect x="0"   y="302" width="390" height="17"  fill="white" opacity="0.9" />
          {/* Lower horizontal */}
          <rect x="0"   y="458" width="390" height="17"  fill="white" opacity="0.85" />
          {/* Left vertical */}
          <rect x="109" y="132" width="16"  height="288" fill="white" opacity="0.9" />
          {/* Right vertical */}
          <rect x="263" y="132" width="16"  height="198" fill="white" opacity="0.85" />

          {/* Road center dashes */}
          <line x1="195" y1="0"   x2="195" y2="560" stroke="#FDD835" strokeWidth="1.2" strokeDasharray="10 8" opacity="0.45" />
          <line x1="0"   y1="140" x2="390" y2="140" stroke="#FDD835" strokeWidth="1.2" strokeDasharray="10 8" opacity="0.45" />
          <line x1="0"   y1="310" x2="390" y2="310" stroke="#FDD835" strokeWidth="1.2" strokeDasharray="10 8" opacity="0.45" />

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
              <g key={b.id}>
                {isTarget && (
                  <rect x={b.x - 3} y={b.y - 3} width={b.w + 6} height={b.h + 6} rx="7"
                    fill="#1A73E8" opacity="0.12" />
                )}
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="5"
                  fill={bgColor} stroke={strokeColor} strokeWidth={isTarget ? 2.5 : 1.5} />
                <text
                  x={b.labelX} y={b.labelY}
                  textAnchor="middle" fontSize={isTarget ? 12 : 11}
                  fontWeight={isTarget ? "700" : "500"}
                  fill={isTarget ? "#1A73E8" : b.id === "食堂" ? "#F9A825" : "#546E7A"}
                >
                  {b.id}
                </text>
              </g>
            );
          })}

          {/* 正門 */}
          <rect x="174" y="498" width="42" height="22" rx="4" fill="#37474F" />
          <text x="195" y="513" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">正　門</text>

          {/* Route — 現在地(使えないときは正門)から目的の建物の入口まで */}
          {route && (
            <>
              <motion.path
                key={`w-${bld!.id}`}
                d={routeToPath(route)} fill="none"
                stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"
                opacity="0.55"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.25 }}
              />
              <motion.path
                key={`b-${bld!.id}`}
                d={routeToPath(route)} fill="none"
                stroke="#1A73E8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.25 }}
              />
            </>
          )}

          {/* Destination pin */}
          {bld && <Pin x={bld.pinX} y={bld.pinY} />}

          {/* 現在地 */}
          <CurrentLocation at={start} heading={location.heading} label={usingGps ? "現在地" : "正門(仮の現在地)"} />

          {/* Compass */}
          <Compass />
        </svg>
      </div>

      {/* Top search bar */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-12 px-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
            aria-label="戻る"
          >
            <ArrowLeft size={20} color="#202124" />
          </button>
          <div
            className="flex-1 bg-white rounded-3xl px-4 py-2.5 flex items-center gap-2"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
          >
            <MapPin size={14} color="#EA4335" />
            <div className="flex-1">
              <p style={{ fontSize: 14, fontWeight: 600, color: "#202124" }}>{destination.building}</p>
              <p style={{ fontSize: 11, color: "#80868B" }}>
                {usingGps ? "現在地" : "正門"}から徒歩約{walkText}分
              </p>
              {location.status !== "ok" && (
                <p style={{ fontSize: 10, color: "#E37400" }}>{FALLBACK_REASON[location.status]}</p>
              )}
            </div>
          </div>
        </div>

        {/* iPhone の Safari は、方角センサーの許可をボタンから求める必要がある */}
        {location.headingPermission === "prompt" && (
          <div className="flex justify-end mt-2">
            <button
              onClick={location.requestHeading}
              className="flex items-center gap-1.5 bg-white rounded-full px-3 py-2"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.25)", fontSize: 12, fontWeight: 600, color: "#1A73E8" }}
            >
              <CompassIcon size={14} color="#1A73E8" />
              向いている方角を表示
            </button>
          </div>
        )}
      </div>

      {/* Bottom card */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-20"
        style={{ height: 214, boxShadow: "0 -2px 20px rgba(0,0,0,0.15)" }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-5">
          {/* Course name / place name + tags */}
          <p className="truncate" style={{ fontSize: 19, fontWeight: 700, color: "#202124", lineHeight: 1.3 }}>
            {title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded-md"
              style={{ fontSize: 11, fontWeight: 600, backgroundColor: "#E8F0FE", color: "#1A73E8" }}>
              {destination.building}
            </span>
            {roomText && <span style={{ fontSize: 13, color: "#5F6368" }}>{roomText}</span>}
          </div>

          {/* Info row */}
          <div className="flex items-center gap-4 mt-2.5 pt-2.5" style={{ borderTop: "1px solid #E8EAED" }}>
            <div className="flex items-center gap-1.5">
              <Footprints size={13} color="#1A73E8" />
              <span style={{ fontSize: 12, color: "#1A73E8", fontWeight: 600 }}>徒歩{walkText}分</span>
            </div>
            {course && (
              <div className="flex items-center gap-1.5">
                <Clock size={13} color="#80868B" />
                <span style={{ fontSize: 12, color: "#5F6368" }}>{formatSlotWithTime(course.day, course.period)}</span>
              </div>
            )}
          </div>

          {/* Enter building button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onEnterBuilding}
            className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 mt-3"
            style={{ backgroundColor: "#1A73E8" }}
          >
            <Navigation size={17} color="white" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>建物に入る → フロアマップ</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
