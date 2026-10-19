import { motion } from "motion/react";
import { ArrowLeft, Clock } from "lucide-react";
import type { Course, Destination } from "../types";
import { formatRoom, formatSlotWithTime } from "../lib/schedule";

type Props = {
  destination: Destination;
  course?: Course;
  onBack: () => void;
};

export function FloorMap({ destination, course, onBack }: Props) {
  // 階が分からない(棟だけを検索した)ときは 1F を表示する
  const floor = destination.floor ?? 1;
  const roomText = destination.roomNumber ? formatRoom(destination.roomNumber) : undefined;

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
            aria-label="キャンパスマップに戻る"
          >
            <ArrowLeft size={18} color="#5F6368" />
          </button>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#202124" }}>
              {destination.building}　{floor}F
            </p>
            <p style={{ fontSize: 12, color: "#80868B" }}>{roomText ? `${roomText}の場所` : "フロアマップ"}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* フロアマップのデータがまだないため、表示位置だけ確保しておく */}
        <div
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl"
          style={{ aspectRatio: "0.85", border: "2px dashed #BDC1C6", backgroundColor: "#F1F3F4" }}
        >
          <p style={{ fontSize: 18, fontWeight: 700, color: "#5F6368" }}>ここにフロアマップを表示</p>
          <p style={{ fontSize: 12, color: "#80868B" }}>
            {destination.building} {floor}F の図{roomText ? `と、${roomText}のピン` : ""}
          </p>
        </div>

        {/* 行き先の情報 */}
        <div className="bg-white rounded-2xl px-4 py-3.5 space-y-1" style={{ border: "1px solid #E8EAED" }}>
          {course && <p style={{ fontSize: 16, fontWeight: 700, color: "#202124" }}>{course.name}</p>}
          <p style={{ fontSize: 13, color: "#5F6368" }}>
            {destination.building} {floor}F{roomText ? ` ${roomText}` : ""}
          </p>
          {course && (
            <div className="flex items-center gap-1.5">
              <Clock size={13} color="#80868B" />
              <span style={{ fontSize: 12, color: "#5F6368" }}>{formatSlotWithTime(course.day, course.period)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
