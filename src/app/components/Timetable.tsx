import { useState } from "react";
import { Building2, MapPin, Search, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Course, NewCourse } from "../types";
import { searchPlaces, type Place } from "../data/places";
import { DAYS, PERIODS, formatLocation, formatRoom, formatSlot } from "../lib/schedule";
import { matchesQuery, tokenize } from "../lib/search";
import { CourseEditModal } from "./CourseEditModal";
import { CourseSearchModal } from "./CourseSearchModal";

type Props = {
  courses: Course[];
  onSelectCourse: (c: Course) => void;
  onSelectPlace: (p: Place) => void;
  onAddCourse: (data: NewCourse) => void;
  onUpdateCourse: (id: string, data: NewCourse) => void;
  onDeleteCourse: (id: string) => void;
};

// 開いているモーダル。add は授業登録検索(空きコマから開いたときはその曜日・時限)、edit は登録済み講義の編集
type FormState = { mode: "add"; day?: number; period?: number } | { mode: "edit"; editing: Course } | null;

export function Timetable({ courses, onSelectCourse, onSelectPlace, onAddCourse, onUpdateCourse, onDeleteCourse }: Props) {
  const [search, setSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<FormState>(null);

  const tokens = tokenize(search);
  const searching = tokens.length > 0;
  // 登録済みの講義:授業名・曜日・時限・教員名・教室・棟で検索
  const courseResults = searching
    ? courses.filter(c =>
        matchesQuery(tokens, { texts: [c.name, c.professor, c.roomNumber, c.building], day: c.day, period: c.period })
      )
    : [];
  // キャンパス自由検索:教室名・棟の名前で検索
  const placeResults = searching ? searchPlaces(search) : [];

  const getCourse = (day: number, period: number) =>
    courses.find(c => c.day === day && c.period === period);

  return (
    <motion.div
      className="flex flex-col h-full bg-gray-50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="bg-white pt-12 pb-3 px-4" style={{ boxShadow: "0 1px 0 #E8EAED" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#202124" }}>時間割</h1>
            <p style={{ fontSize: 11, color: "#80868B" }}>2026年度 前期</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(e => !e)}
              className="px-3 py-1.5 rounded-xl"
              style={{
                fontSize: 13, fontWeight: 600,
                backgroundColor: editMode ? "#EA4335" : "#F1F3F4",
                color: editMode ? "white" : "#5F6368",
              }}
            >
              {editMode ? "完了" : "編集"}
            </button>
            <button
              onClick={() => setForm({ mode: "add" })}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#1A73E8" }}
              aria-label="授業を検索して登録"
            >
              <Plus size={18} color="white" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ backgroundColor: "#F1F3F4" }}>
          <Search size={14} color="#80868B" />
          <input
            type="text"
            placeholder="講義名・曜日・時限・教員・教室・棟で検索"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14, color: "#202124" }}
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="検索をクリア">
              <X size={14} color="#80868B" />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {searching && (
        <div className="flex-1 overflow-auto bg-white pb-8">
          {courseResults.length === 0 && placeResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <span style={{ fontSize: 15, color: "#80868B" }}>「{search.trim()}」に一致する講義・場所なし</span>
            </div>
          ) : (
            <>
              {courseResults.length > 0 && (
                <>
                  <SectionTitle>登録済みの講義 {courseResults.length}件</SectionTitle>
                  {courseResults.map(c => (
                    <ResultRow
                      key={c.id}
                      onClick={() => { setSearch(""); onSelectCourse(c); }}
                      icon={<div className="w-3 h-3 rounded-full flex-shrink-0 mx-0.5" style={{ backgroundColor: c.color }} />}
                      title={c.name}
                      meta={`${formatSlot(c.day, c.period)}　${formatLocation(c)}${c.professor ? `　${c.professor}` : ""}`}
                    />
                  ))}
                </>
              )}

              {placeResults.length > 0 && (
                <>
                  <SectionTitle>キャンパス内の場所 {placeResults.length}件</SectionTitle>
                  {placeResults.map(p => (
                    <ResultRow
                      key={p.key}
                      onClick={() => { setSearch(""); onSelectPlace(p); }}
                      icon={p.roomNumber ? <MapPin size={16} color="#EA4335" /> : <Building2 size={16} color="#1A73E8" />}
                      title={p.title}
                      meta={p.roomNumber ? `${p.building} ${p.floor}F` : "建物"}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Timetable grid */}
      {!searching && (
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
                          onClick={() => (editMode ? setForm({ mode: "edit", editing: c }) : onSelectCourse(c))}
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
                      // 空きコマをタップすると、その曜日・時限で絞り込んだ授業登録検索を開く
                      <button
                        onClick={() => setForm({ mode: "add", day: di, period: p.period })}
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
      )}

      <AnimatePresence>
        {form?.mode === "add" && (
          <CourseSearchModal
            key="add"
            existingCourses={courses}
            initialDay={form.day}
            initialPeriod={form.period}
            onRegister={data => { onAddCourse(data); setForm(null); }}
            onClose={() => setForm(null)}
          />
        )}
        {form?.mode === "edit" && (
          <CourseEditModal
            key="edit"
            existingCourses={courses}
            editing={form.editing}
            onSubmit={data => { onUpdateCourse(form.editing.id, data); setForm(null); }}
            onClose={() => setForm(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-3.5 pb-1.5" style={{ fontSize: 12, color: "#80868B", fontWeight: 700, backgroundColor: "#F9FAFB" }}>
      {children}
    </p>
  );
}

function ResultRow({ onClick, icon, title, meta }: { onClick: () => void; icon: React.ReactNode; title: string; meta: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50"
      style={{ borderBottom: "1px solid #F1F3F4" }}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 15, fontWeight: 600, color: "#202124" }} className="truncate">{title}</p>
        <p style={{ fontSize: 11, color: "#80868B" }}>{meta}</p>
      </div>
    </button>
  );
}
