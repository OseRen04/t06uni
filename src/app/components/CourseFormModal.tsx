import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Search, X } from "lucide-react";
import type { Course, NewCourse } from "../types";
import { CATALOG } from "../data/catalog";
import { CLASSROOM_BUILDINGS } from "../data/campus";
import { DAYS, PERIODS, formatLocation, formatPeriod, formatSlot } from "../lib/schedule";
import { matchesQuery, tokenize } from "../lib/search";

type Props = {
  existingCourses: Course[];
  editing?: Course;   // 指定があれば編集モード
  onSubmit: (data: NewCourse) => void;
  onClose: () => void;
};

export function CourseFormModal({ existingCourses, editing, onSubmit, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [name, setName] = useState(editing?.name ?? "");
  const [building, setBuilding] = useState(editing?.building ?? CLASSROOM_BUILDINGS[0]);
  const [floor, setFloor] = useState(editing?.floor ?? 1);
  const [roomNumber, setRoomNumber] = useState(editing?.roomNumber ?? "");
  const [professor, setProfessor] = useState(editing?.professor ?? "");
  const [day, setDay] = useState(editing?.day ?? 0);
  const [period, setPeriod] = useState(editing?.period ?? 1);

  // 編集中の講義自身とは重複扱いしない
  const others = existingCourses.filter(c => c.id !== editing?.id);
  const occupant = (d: number, p: number) => others.find(c => c.day === d && c.period === p);
  const conflict = occupant(day, period);
  const canSubmit = name.trim() !== "" && roomNumber.trim() !== "" && !conflict;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), building, floor, roomNumber: roomNumber.trim(), professor: professor.trim(), day, period });
  };

  // 授業登録検索:授業名・曜日・時限(何コマ)・教員名で授業一覧を探す
  const tokens = tokenize(query);
  const catalogResults = tokens.length
    ? CATALOG.filter(c => matchesQuery(tokens, { texts: [c.name, c.professor], day: c.day, period: c.period }))
    : [];

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
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#202124" }}>{editing ? "講義を編集" : "講義を追加"}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center" aria-label="閉じる">
              <X size={16} color="#5F6368" />
            </button>
          </div>

          {/* 授業登録検索(追加のときだけ) */}
          {!editing && (
            <div className="mb-1">
              <Label>授業を検索して登録</Label>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: "#F1F3F4" }}>
                <Search size={14} color="#80868B" />
                <input
                  type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="授業名・曜日・何コマ・教員名(例:月曜 2限)"
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: 14, color: "#202124" }}
                />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="検索をクリア">
                    <X size={14} color="#80868B" />
                  </button>
                )}
              </div>

              {tokens.length > 0 && catalogResults.length === 0 && (
                <p style={{ fontSize: 12, color: "#80868B", marginTop: 10 }}>
                  一致する授業がありません。下のフォームから手入力で追加できます
                </p>
              )}
              {catalogResults.map(c => {
                const taken = occupant(c.day, c.period);
                const registered = taken?.name === c.name;
                return (
                  <div key={`${c.name}-${c.day}-${c.period}`} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: "1px solid #F1F3F4" }}>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 14, fontWeight: 700, color: "#202124" }}>{c.name}</p>
                      <p style={{ fontSize: 11, color: "#5F6368" }}>{formatSlot(c.day, c.period)}　{c.professor}</p>
                      <p style={{ fontSize: 11, color: "#5F6368" }}>{formatLocation(c)}</p>
                      {taken && !registered && (
                        <p style={{ fontSize: 11, color: "#EA4335", marginTop: 2 }}>この時間には「{taken.name}」が登録済み</p>
                      )}
                    </div>
                    <button
                      onClick={() => onSubmit(c)}
                      disabled={!!taken}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl flex-shrink-0"
                      style={{ backgroundColor: taken ? "#F1F3F4" : "#1A73E8" }}
                      aria-label={`${c.name}を登録`}
                    >
                      {registered ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#34A853" }}>登録済み</span>
                      ) : (
                        <>
                          <Plus size={14} color={taken ? "#9AA0A6" : "white"} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: taken ? "#9AA0A6" : "white" }}>登録</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}

              <div className="flex items-center gap-2 my-5">
                <div className="flex-1 h-px" style={{ backgroundColor: "#E8EAED" }} />
                <span style={{ fontSize: 11, color: "#9AA0A6" }}>見つからないときは手入力</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "#E8EAED" }} />
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* 講義名 */}
            <Field label="講義名 *">
              <TextInput value={name} onChange={setName} placeholder="例：マーケティング論" />
            </Field>

            {/* 担当教員 */}
            <Field label="担当教員">
              <TextInput value={professor} onChange={setProfessor} placeholder="例：田中 教授" />
            </Field>

            {/* 曜日・時限 */}
            <Field label="曜日">
              <div className="flex gap-1.5">
                {DAYS.map((d, i) => (
                  <Chip key={i} label={d} selected={day === i} onClick={() => setDay(i)} className="flex-1 py-2.5" />
                ))}
              </div>
            </Field>

            <Field label="時限">
              <div className="flex gap-1.5">
                {PERIODS.map(({ period: p }) => (
                  <Chip key={p} label={formatPeriod(p)} selected={period === p} onClick={() => setPeriod(p)} className="flex-1 py-2.5" />
                ))}
              </div>
              {conflict && (
                <p style={{ fontSize: 11, color: "#EA4335", marginTop: 5 }}>
                  ⚠ {formatSlot(day, period)}にはすでに「{conflict.name}」があります
                </p>
              )}
            </Field>

            {/* 棟 */}
            <Field label="棟">
              <div className="flex flex-wrap gap-2">
                {CLASSROOM_BUILDINGS.map(b => (
                  <Chip key={b} label={b} selected={building === b} onClick={() => setBuilding(b)} small className="px-3.5 py-2" />
                ))}
              </div>
            </Field>

            {/* 階層・教室番号 */}
            <div className="flex gap-3 items-end">
              <div style={{ width: 130 }}>
                <Label>階層</Label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(f => (
                    <Chip key={f} label={`${f}F`} selected={floor === f} onClick={() => setFloor(f)} small className="flex-1 py-2.5" />
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <Label>教室番号 *</Label>
                <TextInput value={roomNumber} onChange={setRoomNumber} placeholder="例：203" />
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full mt-7 py-4 rounded-2xl"
            style={{
              fontSize: 16, fontWeight: 700,
              backgroundColor: canSubmit ? "#1A73E8" : "#E8EAED",
              color: canSubmit ? "white" : "#9AA0A6",
            }}
          >
            {editing ? "保存する" : "追加する"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 700, color: "#80868B", display: "block", marginBottom: 6 }}>{children}</label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-xl outline-none"
      style={{ fontSize: 15, border: "1.5px solid #DADCE0" }}
    />
  );
}

type ChipProps = { label: string; selected: boolean; onClick: () => void; small?: boolean; className?: string };

function Chip({ label, selected, onClick, small, className = "" }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl ${className}`}
      style={{
        fontSize: small ? 13 : 14, fontWeight: 600,
        backgroundColor: selected ? "#1A73E8" : "#F1F3F4",
        color: selected ? "white" : "#5F6368",
      }}
    >
      {label}
    </button>
  );
}
