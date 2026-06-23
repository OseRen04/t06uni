import { motion } from "motion/react";
import { ArrowLeft, MapPin, Clock, Navigation, Footprints } from "lucide-react";
import type { Course } from "../types";

const DAY_NAMES = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日"];
const PERIOD_TIMES = ["8:50–10:20", "10:30–12:00", "13:00–14:30", "14:40–16:10", "16:20–17:50"];

// Campus SVG coordinate system: viewBox 0 0 390 560
// 現在地 (GPS): (195, 510) — near 正門 at bottom center
type BuildingDef = {
  id: string;
  x: number; y: number; w: number; h: number;
  labelX: number; labelY: number;
  pinX: number; pinY: number; // pin tip = top-center of building
  route: string;              // SVG path from 現在地 to building
  walkMin: number;
};

const BUILDINGS: BuildingDef[] = [
  {
    id: "学部棟", x: 120, y: 150, w: 52, h: 128,
    labelX: 146, labelY: 214, pinX: 146, pinY: 134,
    route: "M 195 510 L 195 310 L 117 310 L 117 214 L 120 214",
    walkMin: 3,
  },
  {
    id: "図書館", x: 20, y: 150, w: 82, h: 58,
    labelX: 61, labelY: 179, pinX: 61, pinY: 134,
    route: "M 195 510 L 195 139 L 61 139 L 61 150",
    walkMin: 4,
  },
  {
    id: "研究棟A", x: 290, y: 150, w: 78, h: 52,
    labelX: 329, labelY: 176, pinX: 329, pinY: 134,
    route: "M 195 510 L 195 139 L 329 139 L 329 150",
    walkMin: 5,
  },
  {
    id: "研究棟B", x: 290, y: 218, w: 78, h: 64,
    labelX: 329, labelY: 250, pinX: 329, pinY: 202,
    route: "M 195 510 L 195 310 L 265 310 L 265 250 L 290 250",
    walkMin: 5,
  },
  {
    id: "体育館", x: 18, y: 325, w: 76, h: 80,
    labelX: 56, labelY: 365, pinX: 56, pinY: 309,
    route: "M 195 510 L 195 310 L 117 310 L 117 365 L 94 365",
    walkMin: 3,
  },
  {
    id: "食堂", x: 215, y: 325, w: 70, h: 54,
    labelX: 250, labelY: 352, pinX: 250, pinY: 309,
    route: "M 195 510 L 195 310 L 250 310 L 250 325",
    walkMin: 2,
  },
  {
    id: "学生会館", x: 215, y: 395, w: 70, h: 54,
    labelX: 250, labelY: 422, pinX: 250, pinY: 379,
    route: "M 195 510 L 195 465 L 250 465 L 250 449",
    walkMin: 2,
  },
  {
    id: "講義棟", x: 120, y: 295, w: 52, h: 54,
    labelX: 146, labelY: 322, pinX: 146, pinY: 279,
    route: "M 195 510 L 195 322 L 172 322",
    walkMin: 2,
  },
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
  course: Course;
  onBack: () => void;
  onEnterBuilding: () => void;
};

export function CampusMap({ course, onBack, onEnterBuilding }: Props) {
  const bld = BUILDINGS.find(b => b.id === course.building);

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
          {[
            [44,44],[76,60],[312,36],[342,56],[362,42],
            [28,238],[52,272],[258,408],[288,432],[312,412],
            [68,438],[86,458],[170,530],[220,530],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="10" fill="#81C784" opacity="0.9" />
              <circle cx={cx} cy={cy} r="6.5" fill="#66BB6A" opacity="0.75" />
            </g>
          ))}

          {/* Roads — white */}
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
          {BUILDINGS.map(b => {
            const isTarget = b.id === course.building;
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

          {/* Route — only to selected building */}
          {bld && (
            <>
              <motion.path
                d={bld.route} fill="none"
                stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"
                opacity="0.55"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.25 }}
              />
              <motion.path
                d={bld.route} fill="none"
                stroke="#1A73E8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.25 }}
              />
            </>
          )}

          {/* Destination pin */}
          {bld && <Pin x={bld.pinX} y={bld.pinY} />}

          {/* GPS current location — 正門付近 */}
          <motion.circle
            cx="195" cy="510" r="22" fill="#4285F4" opacity="0.14"
            animate={{ r: [18, 28, 18] }}
            transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
          />
          <circle cx="195" cy="510" r="12" fill="#4285F4" opacity="0.22" />
          <circle cx="195" cy="510" r="8" fill="#4285F4" stroke="white" strokeWidth="2.5" />
          <text x="195" y="530" textAnchor="middle" fontSize="9" fill="#4285F4" fontWeight="700">現在地</text>

          {/* Compass */}
          <Compass />
        </svg>
      </div>

      {/* Top search bar */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-12 px-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
          >
            <ArrowLeft size={20} color="#202124" />
          </button>
          <div
            className="flex-1 bg-white rounded-full px-4 py-2.5 flex items-center gap-2"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
          >
            <MapPin size={14} color="#EA4335" />
            <div className="flex-1">
              <p style={{ fontSize: 14, fontWeight: 600, color: "#202124" }}>{course.building}</p>
              <p style={{ fontSize: 11, color: "#80868B" }}>
                現在地から徒歩約{bld?.walkMin ?? "?"}分
              </p>
            </div>
          </div>
        </div>
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
          {/* Course name + tags */}
          <p style={{ fontSize: 19, fontWeight: 700, color: "#202124", lineHeight: 1.3 }}>
            {course.name}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded-md"
              style={{ fontSize: 11, fontWeight: 600, backgroundColor: "#E8F0FE", color: "#1A73E8" }}>
              {course.building}
            </span>
            <span style={{ fontSize: 13, color: "#5F6368" }}>
              {course.floor}F　{course.roomNumber}号室
            </span>
          </div>

          {/* Info row */}
          <div className="flex items-center gap-4 mt-2.5 pt-2.5" style={{ borderTop: "1px solid #E8EAED" }}>
            <div className="flex items-center gap-1.5">
              <Footprints size={13} color="#1A73E8" />
              <span style={{ fontSize: 12, color: "#1A73E8", fontWeight: 600 }}>徒歩{bld?.walkMin ?? "?"}分</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} color="#80868B" />
              <span style={{ fontSize: 12, color: "#5F6368" }}>
                {DAY_NAMES[course.day]}　{course.period}限　{PERIOD_TIMES[course.period - 1]}
              </span>
            </div>
          </div>

          {/* Enter building button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onEnterBuilding}
            className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 mt-3"
            style={{ backgroundColor: "#1A73E8" }}
          >
            <Navigation size={17} color="white" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>建物に入る → フロア案内</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
