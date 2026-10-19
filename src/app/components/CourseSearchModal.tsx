import { useState } from "react";
import { motion } from "motion/react";
import { Check, Plus, Search, X } from "lucide-react";
import type { Course, NewCourse } from "../types";
import { CATALOG } from "../data/catalog";
import { DAYS, PERIODS, formatLocation, formatPeriod, formatSlot } from "../lib/schedule";
import { tokenize } from "../lib/search";

type Props = {
  existingCourses: Course[];
  initialDay?: number;     // 時間割の空きコマから開いたときは、その曜日・時限で絞り込んでおく
  initialPeriod?: number;
  onRegister: (data: NewCourse) => void;
  onClose: () => void;
};

// 授業登録検索:授業名・曜日・何コマ・教員名で授業一覧を絞り込み、結果からそのまま登録する
export function CourseSearchModal({ existingCourses, initialDay, initialPeriod, onRegister, onClose }: Props) {
  const [name, setName] = useState("");
  const [day, setDay] = useState<number | null>(initialDay ?? null);
  const [period, setPeriod] = useState<number | null>(initialPeriod ?? null);
  const [professor, setProfessor] = useState("");

  const nameTokens = tokenize(name);
  const professorTokens = tokenize(professor);
  const results = CATALOG
    .filter(c =>
      nameTokens.every(t => c.name.toLowerCase().includes(t)) &&
      professorTokens.every(t => c.professor.toLowerCase().includes(t)) &&
      (day === null || c.day === day) &&
      (period === null || c.period === period)
    )
    .sort((a, b) => a.day - b.day || a.period - b.period);

  const occupant = (d: number, p: number) => existingCourses.find(c => c.day === d && c.period === p);
  const filtered = nameTokens.length > 0 || professorTokens.length > 0 || day !== null || period !== null;

  const clearAll = () => { setName(""); setDay(null); setPeriod(null); setProfessor(""); };

  return (
    <>
      <motion.div
        className="absolute inset-0 bg-black/40 z-40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 flex flex-col"
        style={{ height: "92%" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
      >
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* 検索条件 */}
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid #E8EAED" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#202124" }}>授業を検索して登録</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center" aria-label="閉じる">
              <X size={16} color="#5F6368" />
            </button>
          </div>

          <div className="space-y-3">
            <SearchInput label="授業名" value={name} onChange={setName} placeholder="例:経済、英語" />

            <div>
              <Label>曜日</Label>
              <div className="flex gap-1">
                <Chip label="指定なし" selected={day === null} onClick={() => setDay(null)} wide />
                {DAYS.map((d, i) => (
                  <Chip key={i} label={d} selected={day === i} onClick={() => setDay(i)} />
                ))}
              </div>
            </div>

            <div>
              <Label>何コマ(時限)</Label>
              <div className="flex gap-1">
                <Chip label="指定なし" selected={period === null} onClick={() => setPeriod(null)} wide />
                {PERIODS.map(({ period: p }) => (
                  <Chip key={p} label={formatPeriod(p)} selected={period === p} onClick={() => setPeriod(p)} />
                ))}
              </div>
            </div>

            <SearchInput label="教員名" value={professor} onChange={setProfessor} placeholder="例:田中" />
          </div>
        </div>

        {/* 検索結果 */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          <div className="flex items-center justify-between pt-3 pb-1">
            <p style={{ fontSize: 12, fontWeight: 700, color: "#80868B" }}>
              {filtered ? `該当する授業 ${results.length}件` : `すべての授業 ${results.length}件`}
            </p>
            {filtered && (
              <button onClick={clearAll} style={{ fontSize: 12, fontWeight: 600, color: "#1A73E8" }}>条件をクリア</button>
            )}
          </div>

          {results.length === 0 && (
            <p className="py-8 text-center" style={{ fontSize: 13, color: "#80868B" }}>
              条件に合う授業がありません
            </p>
          )}

          {results.map(c => {
            const taken = occupant(c.day, c.period);
            const registered = taken?.name === c.name;
            return (
              <div key={`${c.name}-${c.day}-${c.period}`} className="flex items-center gap-2.5 py-3" style={{ borderBottom: "1px solid #F1F3F4" }}>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize: 15, fontWeight: 700, color: "#202124" }}>{c.name}</p>
                  <p style={{ fontSize: 12, color: "#1A73E8", fontWeight: 600 }}>{formatSlot(c.day, c.period)}</p>
                  <p style={{ fontSize: 11, color: "#5F6368" }}>{c.professor}　{formatLocation(c)}</p>
                  {taken && !registered && (
                    <p style={{ fontSize: 11, color: "#EA4335", marginTop: 2 }}>この時間には「{taken.name}」が登録済み</p>
                  )}
                </div>
                {registered ? (
                  <span className="flex items-center gap-1 px-2 flex-shrink-0" style={{ fontSize: 12, fontWeight: 700, color: "#34A853" }}>
                    <Check size={14} color="#34A853" />登録済み
                  </span>
                ) : (
                  <button
                    onClick={() => onRegister(c)}
                    disabled={!!taken}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl flex-shrink-0"
                    style={{ backgroundColor: taken ? "#F1F3F4" : "#1A73E8" }}
                    aria-label={`${c.name}を登録`}
                  >
                    <Plus size={14} color={taken ? "#9AA0A6" : "white"} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: taken ? "#9AA0A6" : "white" }}>登録</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, fontWeight: 700, color: "#80868B", marginBottom: 5 }}>{children}</p>;
}

function SearchInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "#F1F3F4" }}>
        <Search size={14} color="#80868B" />
        <input
          type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: 14, color: "#202124" }}
        />
        {value && (
          <button onClick={() => onChange("")} aria-label={`${label}をクリア`}>
            <X size={14} color="#80868B" />
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({ label, selected, onClick, wide }: { label: string; selected: boolean; onClick: () => void; wide?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 rounded-xl ${wide ? "px-2.5 flex-shrink-0" : "flex-1"}`}
      style={{
        fontSize: 13, fontWeight: 600,
        backgroundColor: selected ? "#1A73E8" : "#F1F3F4",
        color: selected ? "white" : "#5F6368",
      }}
    >
      {label}
    </button>
  );
}
