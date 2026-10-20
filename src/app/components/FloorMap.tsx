import { motion } from "motion/react";
import { Clock } from "lucide-react";
import type { Course, Destination } from "../types";
import { formatRoom, formatSlotWithTime } from "../lib/schedule";
import { ScreenHeader } from "./common";

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
      <ScreenHeader
        title={`${destination.building} ${floor}F`}
        subtitle={roomText ? `${roomText}の場所` : "フロアマップ"}
        onBack={onBack}
        backLabel="キャンパスマップに戻る"
      />

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* フロアマップのデータがまだないため、表示位置だけ確保しておく */}
        <div
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl"
          style={{ aspectRatio: "0.85", border: "2px dashed #80868B", backgroundColor: "#F1F3F4" }}
          role="img"
          aria-label={`フロアマップはまだありません。${destination.building} ${floor}F${roomText ? `、${roomText}` : ""}`}
        >
          <p style={{ fontSize: 18, fontWeight: 700, color: "#5F6368" }}>ここにフロアマップを表示</p>
          <p style={{ fontSize: 13, color: "#5F6368" }}>
            {destination.building} {floor}F の図{roomText ? `と、${roomText}のピン` : ""}
          </p>
        </div>

        {/* 行き先の情報 */}
        <div className="bg-white rounded-2xl px-4 py-3.5 space-y-1" style={{ border: "1px solid #E8EAED" }}>
          {course && <p style={{ fontSize: 16, fontWeight: 700, color: "#202124" }}>{course.name}</p>}
          <p style={{ fontSize: 14, color: "#3C4043" }}>
            {destination.building} {floor}F{roomText ? ` ${roomText}` : ""}
          </p>
          {course && (
            <div className="flex items-center gap-1.5">
              <Clock size={14} color="#5F6368" aria-hidden="true" />
              <span style={{ fontSize: 13, color: "#3C4043" }}>{formatSlotWithTime(course.day, course.period)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
