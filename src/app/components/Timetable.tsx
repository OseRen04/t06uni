import { MapPin, Plus, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Course } from "../types";
import { useFocusOnMount } from "../hooks/useFocusOnMount";
import { DAYS, PERIODS, formatDay, formatRoom, formatSlot } from "../lib/schedule";

type Props = {
  courses: Course[];
  editMode: boolean;
  onToggleEditMode: () => void;
  onSelectCourse: (c: Course) => void;
  onOpenSearch: (day?: number, period?: number) => void;  // 授業を検索/登録する画面へ(空きコマからはその曜日・時限で)
  onOpenCampusSearch: () => void;                          // 教室・棟を探す(キャンパス自由検索)画面へ
  onEditCourse: (c: Course) => void;
  onDeleteCourse: (c: Course) => void;                     // 確認ダイアログを開く(削除そのものは確認後)
};

export function Timetable({ courses, editMode, onToggleEditMode, onSelectCourse, onOpenSearch, onOpenCampusSearch, onEditCourse, onDeleteCourse }: Props) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
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
            <h1 ref={headingRef} tabIndex={-1} data-focus-fallback style={{ fontSize: 20, fontWeight: 700, color: "#202124" }}>時間割</h1>
            <p style={{ fontSize: 12, color: "#5F6368" }}>2026年度 前期</p>
          </div>
          <button
            onClick={onToggleEditMode}
            className="px-4 py-2 rounded-xl"
            style={{
              fontSize: 14, fontWeight: 700,
              backgroundColor: editMode ? "#C5221F" : "#F1F3F4",
              color: editMode ? "white" : "#3C4043",
            }}
          >
            {editMode ? "削除を終える" : "削除"}
          </button>
        </div>

        {/* 主な操作(授業の登録)は塗りつぶし、場所探しは薄い色にして役割の違いを見せる */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => onOpenSearch()}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
            style={{ backgroundColor: "#1967D2" }}
          >
            <Search size={15} color="white" aria-hidden="true" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>授業を検索/登録する</span>
          </button>
          <button
            onClick={onOpenCampusSearch}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
            style={{ backgroundColor: "#E8F0FE" }}
          >
            <MapPin size={15} color="#1967D2" aria-hidden="true" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1967D2" }}>教室・棟を探す</span>
          </button>
        </div>

        {/* 編集モード中であることと、できる操作を文字で伝える(色だけに頼らない) */}
        {editMode && (
          <p className="mt-2 px-3 py-2 rounded-lg" style={{ fontSize: 13, color: "#A50E0E", backgroundColor: "#FCE8E6" }} role="status">
            削除モード:講義の右上の×で削除できます(講義をタップすると内容を変更できます)
          </p>
        )}
      </div>

      {/* 時間割(表として読み上げられるよう、表・行・見出しの役割を付ける)。
          曜日の見出しは上に固定するので、フォーカスした講義が隠れないよう scroll-padding を取る */}
      <div className="flex-1 overflow-auto px-2 pb-4" style={{ scrollPaddingTop: 48 }}>
        <div role="table" aria-label="時間割(行が時限、列が曜日)">
          {/* Day headers */}
          <div role="row" className="flex sticky top-0 z-10 bg-gray-50 pt-2 pb-1">
            <div role="columnheader" style={{ width: 40, flexShrink: 0 }}>
              <span className="sr-only">時限</span>
            </div>
            {DAYS.map((d, i) => (
              <div key={d} role="columnheader" className="flex-1 text-center" style={{ fontSize: 14, fontWeight: 700, color: "#3C4043" }}>
                <span aria-hidden="true">{d}</span>
                <span className="sr-only">{formatDay(i)}</span>
              </div>
            ))}
          </div>

          {/* Period rows。1限の行だけ、削除ボタンが固定ヘッダーに隠れないよう上に余白を取る */}
          {PERIODS.map((p, pi) => (
            <div key={p.period} role="row" className={`flex mb-1 items-stretch ${pi === 0 ? "mt-2" : ""}`}>
              {/* Period label */}
              <div role="rowheader" style={{ width: 40, flexShrink: 0 }} className="flex flex-col items-center justify-center pr-1">
                <span style={{ fontSize: 16, fontWeight: 700, color: "#3C4043" }}>
                  {p.period}<span className="sr-only">限</span>
                </span>
                <span style={{ fontSize: 10, color: "#5F6368" }}>{p.start}</span>
                <span style={{ fontSize: 10, color: "#5F6368" }}><span className="sr-only">から</span>{p.end}</span>
              </div>

              {/* Day cells */}
              {DAYS.map((_, di) => {
                const c = getCourse(di, p.period);
                return (
                  <div key={di} role="cell" className="flex-1 px-0.5" style={{ minHeight: 80 }}>
                    {c ? (
                      <div className="relative w-full h-full" style={{ minHeight: 80 }}>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => (editMode ? onEditCourse(c) : onSelectCourse(c))}
                          className="w-full h-full rounded-xl flex flex-col justify-between p-1.5 text-left"
                          style={{
                            backgroundColor: c.color,
                            minHeight: 80,
                            border: "1.5px solid rgba(255,255,255,0.7)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          }}
                          aria-label={`${c.name} ${c.building} ${c.floor}F ${formatRoom(c.roomNumber)}。${editMode ? "内容を変更する" : "キャンパスマップで道順を見る"}`}
                        >
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#1F2937", wordBreak: "break-all", lineHeight: 1.3 }}>
                            {c.name}
                          </span>
                          <span className="block" style={{ fontSize: 10, color: "#1F2937", lineHeight: 1.3 }}>
                            {c.building} {c.floor}F<br />{formatRoom(c.roomNumber)}
                          </span>
                        </motion.button>

                        {/* 削除ボタン(押すと確認ダイアログ)。2.5.8 のため 24px 以上にする */}
                        <AnimatePresence>
                          {editMode && (
                            <motion.button
                              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                              onClick={() => onDeleteCourse(c)}
                              className="absolute -top-2 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center z-10"
                              style={{ backgroundColor: "#C5221F", border: "2px solid white" }}
                              aria-label={`${c.name}(${formatSlot(c.day, c.period)})を削除`}
                            >
                              <X size={12} color="white" strokeWidth={3} aria-hidden="true" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      // 空きコマをタップすると、その曜日・時限を選んだ状態で授業を検索/登録する画面を開く
                      <button
                        onClick={() => onOpenSearch(di, p.period)}
                        className="w-full h-full rounded-xl bg-white flex items-center justify-center"
                        style={{ minHeight: 80, border: "1px solid #DADCE0" }}
                        aria-label={`${formatSlot(di, p.period)} 空き。授業を検索/登録する`}
                      >
                        <Plus size={16} color="#6B6F75" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
