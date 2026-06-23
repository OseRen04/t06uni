import { useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Course } from "../types";
import { AddCourseModal } from "./AddCourseModal";

const DAYS = ["月", "火", "水", "木", "金"];
const PERIODS = [
  { n: "1", time: "8:50\n10:20" },
  { n: "2", time: "10:30\n12:00" },
  { n: "3", time: "13:00\n14:30" },
  { n: "4", time: "14:40\n16:10" },
  { n: "5", time: "16:20\n17:50" },
];

type Props = {
  courses: Course[];
  onSelectCourse: (c: Course) => void;
  onDeleteCourse: (id: string) => void;
  onAddCourse: (data: Omit<Course, "id" | "color">) => void;
};

export function Timetable({ courses, onSelectCourse, onDeleteCourse, onAddCourse }: Props) {
  const [search, setSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const q = search.trim().toLowerCase();
  const searchResults = q
    ? courses.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.roomNumber.toLowerCase().includes(q) ||
        c.building.toLowerCase().includes(q) ||
        c.professor.toLowerCase().includes(q)
      )
    : [];

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
              onClick={() => setShowAdd(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#1A73E8" }}
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
            placeholder="講義名・教室・棟で検索"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14, color: "#202124" }}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={14} color="#80868B" />
            </button>
          )}
        </div>
      </div>

      {/* Search results list */}
      {q && (
        <div className="flex-1 overflow-auto bg-white">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <span style={{ fontSize: 15, color: "#80868B" }}>「{search}」に一致する講義なし</span>
            </div>
          ) : (
            <div>
              <p className="px-4 pt-3 pb-1" style={{ fontSize: 12, color: "#80868B", fontWeight: 600 }}>
                {searchResults.length}件
              </p>
              {searchResults.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSearch(""); onSelectCourse(c); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  style={{ borderBottom: "1px solid #F1F3F4" }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#202124" }} className="truncate">{c.name}</p>
                    <p style={{ fontSize: 11, color: "#80868B" }}>
                      {DAYS[c.day]}曜 {c.period}限　{c.building} {c.floor}F {c.roomNumber}号室
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timetable grid */}
      {!q && (
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

          {/* Period rows */}
          {PERIODS.map((p, pi) => (
            <div key={pi} className="flex mb-1 items-stretch">
              {/* Period label */}
              <div style={{ width: 38, flexShrink: 0 }} className="flex flex-col items-center justify-center pr-1">
                <span style={{ fontSize: 15, fontWeight: 700, color: "#5F6368" }}>{p.n}</span>
                {p.time.split("\n").map((t, i) => (
                  <span key={i} style={{ fontSize: 8, color: "#9AA0A6" }}>{t}</span>
                ))}
              </div>

              {/* Day cells */}
              {DAYS.map((_, di) => {
                const c = getCourse(di, pi + 1);
                return (
                  <div key={di} className="flex-1 px-0.5" style={{ minHeight: 72 }}>
                    {c ? (
                      <div className="relative w-full h-full" style={{ minHeight: 72 }}>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => !editMode && onSelectCourse(c)}
                          className="w-full h-full rounded-xl flex flex-col justify-between p-1.5 text-left"
                          style={{
                            backgroundColor: c.color,
                            minHeight: 72,
                            border: "1.5px solid rgba(255,255,255,0.7)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#1F2937", wordBreak: "break-all", lineHeight: 1.3 }}>
                            {c.name}
                          </span>
                          <div>
                            <p style={{ fontSize: 8, color: "#374151" }}>{c.building} {c.floor}F</p>
                            <p style={{ fontSize: 8, color: "#374151" }}>{c.roomNumber}号室</p>
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
                            >
                              <X size={10} color="white" strokeWidth={3} />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div
                        className="w-full h-full rounded-xl bg-white border border-gray-100"
                        style={{ minHeight: 72 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <AddCourseModal
            existingCourses={courses}
            onAdd={data => { onAddCourse(data); setShowAdd(false); }}
            onClose={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
