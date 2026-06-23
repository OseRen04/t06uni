import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import type { Course } from "../types";

type StepType = "entrance" | "elevator" | "corridor" | "classroom";

type Step = {
  id: StepType;
  label: string;
  desc: string;
  photoLabel: string;
};

function buildSteps(floor: number, roomNumber: string, building: string): Step[] {
  const steps: Step[] = [
    {
      id: "entrance",
      label: "正面玄関",
      desc: `${building}の入口から建物内に入ってください`,
      photoLabel: `${building} 正面玄関`,
    },
  ];
  if (floor >= 2) {
    steps.push({
      id: "elevator",
      label: `エレベーター (1F)`,
      desc: `エレベーターに乗り ${floor}F へ上がってください`,
      photoLabel: `1F エレベーター前`,
    });
  }
  steps.push(
    {
      id: "corridor",
      label: `${floor}F 廊下`,
      desc: `廊下を進んで ${roomNumber}号室 を目指してください`,
      photoLabel: `${floor}F 廊下`,
    },
    {
      id: "classroom",
      label: `${roomNumber}号室 入口`,
      desc: `${roomNumber}号室に到着！ドアを開けて入室してください`,
      photoLabel: `${roomNumber}号室 入口`,
    }
  );
  return steps;
}

// ───── Mini floor plan SVG ─────
function MiniFloorPlan({ floor, roomNumber, stepId }: { floor: number; roomNumber: string; stepId: StepType }) {
  // 5 rooms top row, 3 rooms + EV bottom row, corridor in middle
  const topRooms = [1, 2, 3, 4, 5].map(n => ({
    n,
    label: `${floor}0${n}`,
    x: 8 + (n - 1) * 64,
    y: 8,
    w: 58,
    h: 62,
  }));
  const bottomRooms = [6, 7, 8].map(n => ({
    n,
    label: `${floor}0${n}`,
    x: 8 + (n - 6) * 90,
    y: 102,
    w: 80,
    h: 52,
  }));

  // Determine which top-row room corresponds to roomNumber
  const numOnly = parseInt(roomNumber.replace(/\D/g, "")) || 0;
  const suffix = numOnly % 10;
  const targetTopIdx = suffix >= 1 && suffix <= 5 ? suffix - 1 : 2; // fallback center

  return (
    <svg viewBox="0 0 348 164" className="w-full" style={{ display: "block" }}>
      <rect width="348" height="164" fill="#F1F3F4" />
      <rect x="4" y="4" width="340" height="156" rx="6" fill="#FAFAFA" stroke="#DADCE0" strokeWidth="1.5" />

      {/* Corridor */}
      <rect x="4" y="74" width="340" height="20" fill="#E8EAED" />
      <text x="174" y="88" textAnchor="middle" fontSize="8" fill="#9AA0A6">廊下</text>

      {/* Top row rooms */}
      {topRooms.map((r, i) => {
        const isTarget = i === targetTopIdx && stepId === "classroom";
        return (
          <g key={r.n}>
            <rect
              x={r.x} y={r.y} width={r.w} height={r.h} rx="3"
              fill={isTarget ? "#E8F0FE" : "white"}
              stroke={isTarget ? "#1A73E8" : "#DADCE0"}
              strokeWidth={isTarget ? 2 : 1}
            />
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 4}
              textAnchor="middle" fontSize={isTarget ? 11 : 9}
              fontWeight={isTarget ? "700" : "400"}
              fill={isTarget ? "#1A73E8" : "#9AA0A6"}>
              {r.label}
            </text>
          </g>
        );
      })}

      {/* Bottom row rooms */}
      {bottomRooms.map(r => (
        <g key={r.n}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="3" fill="white" stroke="#DADCE0" strokeWidth="1" />
          <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 4} textAnchor="middle" fontSize="9" fill="#9AA0A6">{r.label}</text>
        </g>
      ))}

      {/* Elevator */}
      <rect x="285" y="102" width="50" height="52" rx="3"
        fill={stepId === "elevator" ? "#E6F4EA" : "#F1F3F4"}
        stroke={stepId === "elevator" ? "#34A853" : "#DADCE0"}
        strokeWidth={stepId === "elevator" ? 2 : 1}
      />
      <text x="310" y="124" textAnchor="middle" fontSize="9" fill={stepId === "elevator" ? "#34A853" : "#9AA0A6"} fontWeight={stepId === "elevator" ? "700" : "400"}>▲</text>
      <text x="310" y="138" textAnchor="middle" fontSize="9" fill={stepId === "elevator" ? "#34A853" : "#9AA0A6"} fontWeight={stepId === "elevator" ? "700" : "400"}>EV</text>

      {/* Entrance (1F only) */}
      <rect x="163" y="150" width="32" height="10" rx="3" fill={stepId === "entrance" ? "#1A73E8" : "#9AA0A6"} />
      <text x="179" y="158" textAnchor="middle" fontSize="7" fill="white">入口</text>

      {/* You-are-here dot */}
      {stepId === "entrance" && <circle cx="179" cy="155" r="5" fill="#4285F4" stroke="white" strokeWidth="1.5" />}
      {stepId === "elevator" && <circle cx="310" cy="128" r="5" fill="#34A853" stroke="white" strokeWidth="1.5" />}
      {stepId === "corridor" && <circle cx="174" cy="84" r="5" fill="#FBBC04" stroke="white" strokeWidth="1.5" />}
      {stepId === "classroom" && (
        <circle
          cx={topRooms[targetTopIdx].x + topRooms[targetTopIdx].w / 2}
          cy={topRooms[targetTopIdx].y + topRooms[targetTopIdx].h / 2}
          r="5" fill="#EA4335" stroke="white" strokeWidth="1.5"
        />
      )}
    </svg>
  );
}

// ───── Gray photo placeholder ─────
function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="w-full rounded-2xl flex flex-col items-center justify-center gap-3"
      style={{ height: 188, backgroundColor: "#E0E0E0", border: "1.5px solid #BDBDBD" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: "#BDBDBD" }}
      >
        <Camera size={28} color="#757575" />
      </div>
      <div className="text-center px-4">
        <p style={{ fontSize: 14, fontWeight: 600, color: "#424242" }}>{label}</p>
        <p style={{ fontSize: 11, color: "#9E9E9E", marginTop: 3 }}>テスト用コンテンツ</p>
      </div>
      <div className="px-3 py-1 rounded-full" style={{ backgroundColor: "#9E9E9E" }}>
        <span style={{ fontSize: 10, color: "white", fontWeight: 700, letterSpacing: 1 }}>IMAGE</span>
      </div>
    </div>
  );
}

type Props = {
  course: Course;
  onBack: () => void;
};

export function FloorMap({ course, onBack }: Props) {
  const steps = buildSteps(course.floor, course.roomNumber, course.building);
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === steps.length - 1;

  return (
    <motion.div
      className="flex flex-col h-full bg-gray-50"
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
    >
      {/* Header */}
      <div className="bg-white pt-12 pb-3 px-4" style={{ boxShadow: "0 1px 0 #E8EAED" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft size={18} color="#5F6368" />
          </button>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#202124" }}>
              {course.building}　{course.floor}F
            </p>
            <p style={{ fontSize: 12, color: "#80868B" }}>{course.roomNumber}号室への案内</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-3">

        {/* Step progress dots */}
        <div className="flex items-center justify-between">
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1A73E8" }}>
            ステップ {stepIdx + 1} / {steps.length}
          </p>
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === stepIdx ? 22 : 8,
                  height: 8,
                  backgroundColor:
                    i < stepIdx ? "#34A853" :
                    i === stepIdx ? "#1A73E8" :
                    "#DADCE0",
                }}
              />
            ))}
          </div>
        </div>

        {/* Mini floor plan */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #DADCE0" }}>
          <MiniFloorPlan floor={course.floor} roomNumber={course.roomNumber} stepId={step.id} />
        </div>

        {/* Step description card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-white rounded-2xl px-4 py-3.5"
            style={{ border: "1px solid #E8EAED" }}
          >
            <p style={{ fontSize: 16, fontWeight: 700, color: "#202124" }}>{step.label}</p>
            <p style={{ fontSize: 13, color: "#5F6368", marginTop: 5, lineHeight: 1.6 }}>{step.desc}</p>
          </motion.div>
        </AnimatePresence>

        {/* Photo placeholder */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`photo-${step.id}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
          >
            <PhotoPlaceholder label={step.photoLabel} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation footer */}
      <div
        className="bg-white px-4 pb-8 pt-3"
        style={{ boxShadow: "0 -1px 0 #E8EAED" }}
      >
        {isLast ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onBack}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
            style={{ backgroundColor: "#34A853" }}
          >
            <CheckCircle2 size={20} color="white" />
            <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>到着！完了</span>
          </motion.button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => !isFirst && setStepIdx(i => i - 1)}
              disabled={isFirst}
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: isFirst ? "#F1F3F4" : "#E8F0FE" }}
            >
              <ChevronLeft size={22} color={isFirst ? "#9AA0A6" : "#1A73E8"} />
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStepIdx(i => i + 1)}
              className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
              style={{ backgroundColor: "#1A73E8" }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>次へ進む</span>
              <ChevronRight size={18} color="white" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
