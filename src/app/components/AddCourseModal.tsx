import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import type { Course } from "../types";

const BUILDINGS = ["学部棟", "研究棟A", "研究棟B", "図書館", "体育館", "講義棟"];
const DAYS = ["月", "火", "水", "木", "金"];

type Props = {
  existingCourses: Course[];
  onAdd: (data: Omit<Course, "id" | "color">) => void;
  onClose: () => void;
};

export function AddCourseModal({ existingCourses, onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("学部棟");
  const [floor, setFloor] = useState(1);
  const [roomNumber, setRoomNumber] = useState("");
  const [professor, setProfessor] = useState("");
  const [day, setDay] = useState(0);
  const [period, setPeriod] = useState(1);

  const conflict = existingCourses.some(c => c.day === day && c.period === period);
  const canSubmit = name.trim() !== "" && roomNumber.trim() !== "" && !conflict;

  const handleAdd = () => {
    if (!canSubmit) return;
    onAdd({ name: name.trim(), building, floor, roomNumber: roomNumber.trim(), professor: professor.trim(), day, period });
  };

  return (
    <>
      <motion.div
        className="absolute inset-0 bg-black/40 z-40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 overflow-auto"
        style={{ maxHeight: "92%" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
      >
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 pt-4 pb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#202124" }}>講義を追加</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={16} color="#5F6368" />
            </button>
          </div>

          <div className="space-y-5">
            {/* 講義名 */}
            <Field label="講義名 *">
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="例：マーケティング論"
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 15, border: "1.5px solid #DADCE0" }}
              />
            </Field>

            {/* 担当教員 */}
            <Field label="担当教員">
              <input
                type="text" value={professor} onChange={e => setProfessor(e.target.value)}
                placeholder="例：田中 教授"
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 15, border: "1.5px solid #DADCE0" }}
              />
            </Field>

            {/* 曜日・時限 */}
            <Field label="曜日">
              <div className="flex gap-1.5">
                {DAYS.map((d, i) => (
                  <button
                    key={i} onClick={() => setDay(i)}
                    className="flex-1 py-2.5 rounded-xl"
                    style={{ fontSize: 14, fontWeight: 600, backgroundColor: day === i ? "#1A73E8" : "#F1F3F4", color: day === i ? "white" : "#5F6368" }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="時限">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(p => (
                  <button
                    key={p} onClick={() => setPeriod(p)}
                    className="flex-1 py-2.5 rounded-xl"
                    style={{ fontSize: 14, fontWeight: 600, backgroundColor: period === p ? "#1A73E8" : "#F1F3F4", color: period === p ? "white" : "#5F6368" }}
                  >
                    {p}限
                  </button>
                ))}
              </div>
              {conflict && (
                <p style={{ fontSize: 11, color: "#EA4335", marginTop: 5 }}>
                  ⚠ この曜日・時限にはすでに講義があります
                </p>
              )}
            </Field>

            {/* 棟 */}
            <Field label="棟">
              <div className="flex flex-wrap gap-2">
                {BUILDINGS.map(b => (
                  <button
                    key={b} onClick={() => setBuilding(b)}
                    className="px-3.5 py-2 rounded-xl"
                    style={{ fontSize: 13, fontWeight: 600, backgroundColor: building === b ? "#1A73E8" : "#F1F3F4", color: building === b ? "white" : "#5F6368" }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </Field>

            {/* 階層・教室番号 */}
            <div className="flex gap-3 items-end">
              <div style={{ width: 130 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#80868B", display: "block", marginBottom: 6 }}>階層</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(f => (
                    <button
                      key={f} onClick={() => setFloor(f)}
                      className="flex-1 py-2.5 rounded-xl"
                      style={{ fontSize: 13, fontWeight: 600, backgroundColor: floor === f ? "#1A73E8" : "#F1F3F4", color: floor === f ? "white" : "#5F6368" }}
                    >
                      {f}F
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <label style={{ fontSize: 12, fontWeight: 700, color: "#80868B", display: "block", marginBottom: 6 }}>教室番号 *</label>
                <input
                  type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)}
                  placeholder="例：203"
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 15, border: "1.5px solid #DADCE0" }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!canSubmit}
            className="w-full mt-7 py-4 rounded-2xl"
            style={{
              fontSize: 16, fontWeight: 700,
              backgroundColor: canSubmit ? "#1A73E8" : "#E8EAED",
              color: canSubmit ? "white" : "#9AA0A6",
            }}
          >
            追加する
          </button>
        </div>
      </motion.div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#80868B", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
