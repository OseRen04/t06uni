import { MapPin, Plus, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Course } from "../types";
import { DAYS, PERIODS, formatRoom, formatSlot } from "../lib/schedule";

type Props = {
  courses: Course[];
  editMode: boolean;
  onToggleEditMode: () => void;
  onSelectCourse: (c: Course) => void;
  onOpenSearch: (day?: number, period?: number) => void;  // 授業を検索/登録する画面へ(空きコマからはその曜日・時限で)
  onOpenCampusSearch: () => void;                          // 教室・棟を探す(キャンパス自由検索)画面へ
  onEditCourse: (c: Course) => void;
  onDeleteCourse: (id: string) => void;
};

export function Timetable({ courses, editMode, onToggleEditMode, onSelectCourse, onOpenSearch, onOpenCampusSearch, onEditCourse, onDeleteCourse }: Props) {
  const getCourse = (day: number, period: number) =>
    courses.find(c => c.day === day && c.period === period);

  return (
    <motion.div
      className="flex flex-col h-full bg-gray-50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="bg-white pt-12 pb-3 px-4" style={{ boxShadow: "0 1px 0 #E8EAED" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#202124" }}>時間割</h1>
            <p style={{ fontSize: 11, color: "#80868B" }}>2026年度 前期</p>
          </div>
          <button
            onClick={onToggleEditMode}
            className="px-3 py-1.5 rounded-xl"
            style={{
              fontSize: 13, fontWeight: 600,
              backgroundColor: editMode ? "#EA4335" : "#F1F3F4",
              color: editMode ? "white" : "#5F6368",
            }}
          >
            {editMode ? "完了" : "編集"}
          </button>
        </div>

        {/* 主な操作(授業の登録)は塗りつぶし、場所探しは薄い色にして役割の違いを見せる */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => onOpenSearch()}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
            style={{ backgroundColor: "#1A73E8" }}
          >
            <Search size={15} color="white" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>授業を検索/登録する</span>
          </button>
          <button
            onClick={onOpenCampusSearch}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
            style={{ backgroundColor: "#E8F0FE" }}
          >
            <MapPin size={15} color="#1A73E8" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1A73E8" }}>教室・棟を探す</span>
          </button>
        </div>
      </div>

      {/* Timetable grid */}
      <div className="flex-1 overflow-auto px-2 pb-4">
        {/* Day headers */}
        <div className="flex sticky top-0 z-10 bg-gray-50 pt-2 pb-1">
          <div style={{ width: 38, flexShrink: 0 }} />
          {DAYS.map(d => (
            <div key={d} className="flex-1 text-center" style={{ fontSize: 13, fontWeight: 600, color: "#5F6368" }}>
              {d}
            </div>
          ))}
        </div>

        {editMode && (
          <p className="text-center" style={{ fontSize: 11, color: "#EA4335" }}>
            講義をタップすると内容を編集、×で削除できます
          </p>
        )}

        {/* Period rows。1限の行だけ、削除バッジが固定ヘッダーに隠れないよう上に余白を取る */}
        {PERIODS.map((p, pi) => (
          <div key={p.period} className={`flex mb-1 items-stretch ${pi === 0 ? "mt-1.5" : ""}`}>
            {/* Period label */}
            <div style={{ width: 38, flexShrink: 0 }} className="flex flex-col items-center justify-center pr-1">
              <span style={{ fontSize: 15, fontWeight: 700, color: "#5F6368" }}>{p.period}</span>
              <span style={{ fontSize: 8, color: "#9AA0A6" }}>{p.start}</span>
              <span style={{ fontSize: 8, color: "#9AA0A6" }}>{p.end}</span>
            </div>

            {/* Day cells */}
            {DAYS.map((_, di) => {
              const c = getCourse(di, p.period);
              return (
                <div key={di} className="flex-1 px-0.5" style={{ minHeight: 72 }}>
                  {c ? (
                    <div className="relative w-full h-full" style={{ minHeight: 72 }}>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => (editMode ? onEditCourse(c) : onSelectCourse(c))}
                        className="w-full h-full rounded-xl flex flex-col justify-between p-1.5 text-left"
                        style={{
                          backgroundColor: c.color,
                          minHeight: 72,
                          border: "1.5px solid rgba(255,255,255,0.7)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        }}
                        aria-label={editMode ? `${c.name}を編集` : c.name}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#1F2937", wordBreak: "break-all", lineHeight: 1.3 }}>
                          {c.name}
                        </span>
                        <div>
                          <p style={{ fontSize: 8, color: "#374151" }}>{c.building} {c.floor}F</p>
                          <p style={{ fontSize: 8, color: "#374151" }}>{formatRoom(c.roomNumber)}</p>
                        </div>
                      </motion.button>

                      {/* Delete badge in edit mode */}
                      <AnimatePresence>
                        {editMode && (
                          <motion.button
                            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            onClick={() => onDeleteCourse(c.id)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
                            style={{ backgroundColor: "#EA4335" }}
                            aria-label={`${c.name}を削除`}
                          >
                            <X size={10} color="white" strokeWidth={3} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    // 空きコマをタップすると、その曜日・時限を選んだ状態で授業を検索/登録する画面を開く
                    <button
                      onClick={() => onOpenSearch(di, p.period)}
                      className="w-full h-full rounded-xl bg-white border border-gray-100 flex items-center justify-center"
                      style={{ minHeight: 72 }}
                      aria-label={`${formatSlot(di, p.period)}に授業を登録`}
                    >
                      <Plus size={14} color="#DADCE0" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
