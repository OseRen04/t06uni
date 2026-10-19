import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import type { Course } from "../types";
import entranceImage from "../../../assets/genkan.png";
import elevatorImage from "../../../assets/genkan02.png";
import classroomImage from "../../../assets/kougisitu.jpg";

type StepType = "entrance" | "elevator" | "classroom";

type Step = {
  id: StepType;
  label: string;
  desc: string;
  image: string;
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

const MAP_ROOMS = [
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

function buildSteps(): Step[] {
  return [
    {
      id: "entrance",
      label: "学部棟 正面玄関",
      desc: `${DESTINATION_BUILDING}の正面玄関から建物内に入ってください`,
      image: entranceImage,
      imageAlt: "学部棟 正面玄関",
      mapPoint: {
        x: 52.5,
        y: 96,
        label: "正面玄関",
        note: "入口",
      },
    },
    {
      id: "elevator",
      label: "エレベーター前",
      desc: "玄関を入って、案内表示のあるエレベーター前へ進んでください",
      image: elevatorImage,
      imageAlt: "エレベーター前",
      mapPoint: {
        x: 52.5,
        y: 77.5,
        label: "エレベーター前",
        note: "ロビー中央",
      },
    },
    {
      id: "classroom",
      label: `${DESTINATION_ROOM}講義室入口`,
      desc: `${DESTINATION_ROOM}講義室に到着です。入口を確認して入室してください`,
      image: classroomImage,
      imageAlt: `${DESTINATION_ROOM}講義室入口`,
      mapPoint: {
        x: 37,
        y: 86,
        label: `${DESTINATION_ROOM}講義室入口`,
        note: "目的地",
      },
    },
  ];
}

function CssFloorMap({ step, stepIdx }: { step: Step; stepIdx: number }) {
  return (
    <div className="css-floor-map-card">
      <div className="css-floor-map" aria-label={`1F フロアマップ 現在地 ${step.mapPoint.label}`}>
        <div className="floor-chip">
          <span>現在地</span>
          <strong>{step.mapPoint.label}</strong>
          <small>{step.mapPoint.note}</small>
        </div>

        <div className="floor-one-label">1F</div>
        <div className="floor-corridor floor-corridor--left-top" />
        <div className="floor-corridor floor-corridor--right-top" />
        <div className="floor-corridor floor-corridor--main" />
        <div className="floor-corridor floor-corridor--entry" />

        {ROUTE_SEGMENTS.map((segment, i) => (
          <div
            key={i}
            className={`floor-route-segment ${stepIdx >= segment.activeFrom ? "is-active" : ""}`}
            style={{
              left: `${segment.x}%`,
              top: `${segment.y}%`,
              width: `${segment.w}%`,
              height: `${segment.h}%`,
            }}
          />
        ))}

        {MAP_ROOMS.map(room => (
          <div
            key={`${room.label}-${room.x}-${room.y}`}
            className={`floor-room ${room.large ? "floor-room--large" : ""} ${room.target ? "floor-room--target" : ""}`}
            style={{
              left: `${room.x}%`,
              top: `${room.y}%`,
              width: `${room.w}%`,
              height: `${room.h}%`,
              backgroundColor: room.color,
            }}
          >
            {room.label}
          </div>
        ))}

        <div className="floor-elevator" style={{ left: "50%", top: "76%" }}>EV</div>
        <div className="floor-restroom" style={{ left: "53%", top: "76%" }}>WC</div>
        <div className="floor-stairs" style={{ left: "48%", top: "91%" }}>階段</div>

        <div className="floor-target-tag">目的地 104講義室</div>

        <motion.div
          className="floor-current-marker"
          animate={{ left: `${step.mapPoint.x}%`, top: `${step.mapPoint.y}%` }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
        >
          <span>{stepIdx + 1}</span>
        </motion.div>
      </div>
    </div>
  );
}

function RoutePhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="route-photo-card">
      <img
        src={src}
        alt={alt}
        className="route-photo"
      />
    </div>
  );
}

type Props = {
  course: Course;
  onBack: () => void;
};

export function FloorMap({ onBack }: Props) {
  const steps = buildSteps();
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
              {DESTINATION_BUILDING}　1F
            </p>
            <p style={{ fontSize: 12, color: "#80868B" }}>{DESTINATION_ROOM}講義室への案内</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="floor-guide-scroll flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-3">

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

        <CssFloorMap step={step} stepIdx={stepIdx} />

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

        <AnimatePresence mode="wait">
          <motion.div
            key={`photo-${step.id}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
          >
            <RoutePhoto src={step.image} alt={step.imageAlt} />
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
