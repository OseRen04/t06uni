import { useState } from "react";
import { motion } from "motion/react";
import { Check, Plus, Search, User, X } from "lucide-react";
import type { Course, NewCourse } from "../types";
import { CATALOG } from "../data/catalog";
import { generateMockCourses } from "../data/mockCourses";
import { DAYS, PERIODS, formatLocation, formatPeriod, formatPeriodTime, formatSlot } from "../lib/schedule";
import { splitByTokens, tokenize } from "../lib/search";

// 検索結果がこれより少ないときは、模擬の授業で補う
const MIN_RESULTS = 3;

type Props = {
  existingCourses: Course[];
  initialDay?: number;     // 時間割の空きコマから開いたときは、その曜日・時限で絞り込んでおく
  initialPeriod?: number;
  onRegister: (data: NewCourse) => void;
  onClose: () => void;
};

// 同じ曜日・時限の授業をまとめたもの
type SlotGroup = { day: number; period: number; courses: NewCourse[]; occupant?: Course };

// 授業登録検索:授業名・曜日・何コマ・教員名で授業一覧を絞り込み、結果からそのまま登録する
export function CourseSearchModal({ existingCourses, initialDay, initialPeriod, onRegister, onClose }: Props) {
  const [name, setName] = useState("");
  const [day, setDay] = useState<number | null>(initialDay ?? null);
  const [period, setPeriod] = useState<number | null>(initialPeriod ?? null);
  const [professor, setProfessor] = useState("");
  // 登録が目的の画面なので、最初は登録できる(空いている)コマだけを出す
  const [freeOnly, setFreeOnly] = useState(true);

  const nameTokens = tokenize(name);
  const professorTokens = tokenize(professor);
  const occupant = (d: number, p: number) => existingCourses.find(c => c.day === d && c.period === p);
  const filtered = nameTokens.length > 0 || professorTokens.length > 0 || day !== null || period !== null;

  const matched = CATALOG.filter(c =>
    nameTokens.every(t => c.name.toLowerCase().includes(t)) &&
    professorTokens.every(t => c.professor.toLowerCase().includes(t)) &&
    (day === null || c.day === day) &&
    (period === null || c.period === period)
  );
  // モック環境なので、一覧からの該当が少ないときは検索条件どおりの模擬の授業で補い、必ず結果を出す
  const mocks = filtered && matched.length < MIN_RESULTS
    ? generateMockCourses({ name, professor, day, period }, MIN_RESULTS - matched.length, (d, p) => !occupant(d, p))
    : [];

  // 曜日・時限ごとにまとめ、時間割の順(月1 → 金5)に並べる
  const groups: SlotGroup[] = [];
  for (const c of [...matched, ...mocks].sort((a, b) => a.day - b.day || a.period - b.period)) {
    const last = groups[groups.length - 1];
    if (last && last.day === c.day && last.period === c.period) last.courses.push(c);
    else groups.push({ day: c.day, period: c.period, courses: [c], occupant: occupant(c.day, c.period) });
  }
  const visible = freeOnly ? groups.filter(g => !g.occupant) : groups;
  const hiddenCount = groups.length - visible.length;
  const total = visible.reduce((n, g) => n + g.courses.length, 0);

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

        {/* 検索条件(結果を広く見せるため、1 行ずつに詰めている) */}
        <div className="px-5 pt-3 pb-3 space-y-2.5" style={{ borderBottom: "1px solid #E8EAED" }}>
          <div className="flex items-center justify-between">
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#202124" }}>授業を検索して登録</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center" aria-label="閉じる">
              <X size={16} color="#5F6368" />
            </button>
          </div>

          <div className="flex gap-2">
            <SearchInput icon={<Search size={14} color="#80868B" />} label="授業名" value={name} onChange={setName} />
            <SearchInput icon={<User size={14} color="#80868B" />} label="教員名" value={professor} onChange={setProfessor} />
          </div>

          <ChipRow label="曜日">
            <Chip label="すべて" selected={day === null} onClick={() => setDay(null)} wide />
            {DAYS.map((d, i) => (
              <Chip key={i} label={d} selected={day === i} onClick={() => setDay(i)} />
            ))}
          </ChipRow>

          <ChipRow label="コマ">
            <Chip label="すべて" selected={period === null} onClick={() => setPeriod(null)} wide />
            {PERIODS.map(({ period: p }) => (
              <Chip key={p} label={formatPeriod(p)} selected={period === p} onClick={() => setPeriod(p)} />
            ))}
          </ChipRow>
        </div>

        {/* 件数・絞り込みの切り替え */}
        <div className="flex items-center gap-3 px-5 py-2" style={{ backgroundColor: "#F8F9FA", borderBottom: "1px solid #E8EAED" }}>
          <p className="flex-1" style={{ fontSize: 12, fontWeight: 700, color: "#5F6368" }}>
            {total}件
            {hiddenCount > 0 && (
              <span style={{ fontWeight: 400, color: "#80868B" }}>　登録済み{hiddenCount}コマ非表示</span>
            )}
          </p>
          <label className="flex items-center gap-1.5 cursor-pointer" style={{ fontSize: 12, color: "#5F6368" }}>
            <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} className="accent-blue-600" />
            空きコマのみ
          </label>
          {filtered && (
            <button onClick={clearAll} style={{ fontSize: 12, fontWeight: 600, color: "#1A73E8" }}>条件をクリア</button>
          )}
        </div>

        {/* 検索結果(曜日・時限ごと。見出しはスクロールしても上に残る) */}
        <div className="flex-1 overflow-y-auto pb-8">
          {visible.length === 0 && (
            <p className="py-10 text-center" style={{ fontSize: 13, color: "#80868B" }}>
              空いているコマに該当する授業がありません
              {hiddenCount > 0 && (
                <button onClick={() => setFreeOnly(false)} className="block mx-auto mt-2" style={{ fontSize: 12, fontWeight: 600, color: "#1A73E8" }}>
                  登録済みのコマも表示する
                </button>
              )}
            </p>
          )}

          {visible.map(g => (
            <section key={`${g.day}-${g.period}`}>
              <div
                className="sticky top-0 z-10 flex items-center gap-2 px-5 py-1.5"
                style={{ backgroundColor: g.occupant ? "#F1F3F4" : "#E8F0FE" }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: g.occupant ? "#5F6368" : "#1A73E8" }}>
                  {formatSlot(g.day, g.period)}
                </span>
                <span style={{ fontSize: 11, color: "#80868B" }}>{formatPeriodTime(g.period)}</span>
                <span className="flex-1 truncate text-right" style={{ fontSize: 11, fontWeight: 600, color: g.occupant ? "#80868B" : "#1A73E8" }}>
                  {g.occupant ? `登録済み:${g.occupant.name}` : "空き"}
                </span>
              </div>

              {g.courses.map((c, i) => {
                const registered = g.occupant?.name === c.name;
                const blocked = !!g.occupant && !registered;
                return (
                  <div
                    key={`${i}-${c.name}`}
                    className="flex items-center gap-3 px-5 py-2.5"
                    style={{ borderBottom: "1px solid #F1F3F4", opacity: blocked ? 0.45 : 1 }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 15, fontWeight: 700, color: "#202124" }}>
                        <Highlight text={c.name} tokens={nameTokens} />
                      </p>
                      <p className="truncate" style={{ fontSize: 12, color: "#5F6368" }}>
                        <Highlight text={c.professor} tokens={professorTokens} />
                        <span style={{ color: "#9AA0A6" }}> · </span>
                        {formatLocation(c)}
                      </p>
                    </div>
                    {registered ? (
                      <span className="flex items-center gap-1 flex-shrink-0" style={{ fontSize: 12, fontWeight: 700, color: "#34A853" }}>
                        <Check size={14} color="#34A853" />登録済み
                      </span>
                    ) : !blocked && (
                      <button
                        onClick={() => onRegister(c)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl flex-shrink-0"
                        style={{ backgroundColor: "#1A73E8" }}
                        aria-label={`${c.name}を登録`}
                      >
                        <Plus size={14} color="white" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>登録</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      </motion.div>
    </>
  );
}

/** 検索語に一致した部分を黄色で強調する */
function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  return (
    <>
      {splitByTokens(text, tokens).map((part, i) =>
        part.hit
          ? <mark key={i} style={{ backgroundColor: "#FEEFC3", color: "inherit", borderRadius: 2 }}>{part.text}</mark>
          : <span key={i}>{part.text}</span>
      )}
    </>
  );
}

function SearchInput({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex-1 min-w-0 flex items-center gap-1.5 rounded-xl px-2.5 py-2" style={{ backgroundColor: "#F1F3F4" }}>
      {icon}
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={label} aria-label={label}
        className="flex-1 min-w-0 bg-transparent outline-none"
        style={{ fontSize: 14, color: "#202124" }}
      />
      {value && (
        <button onClick={() => onChange("")} aria-label={`${label}をクリア`}>
          <X size={13} color="#80868B" />
        </button>
      )}
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0" style={{ width: 28, fontSize: 12, fontWeight: 700, color: "#80868B" }}>{label}</span>
      <div className="flex-1 flex gap-1">{children}</div>
    </div>
  );
}

function Chip({ label, selected, onClick, wide }: { label: string; selected: boolean; onClick: () => void; wide?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`py-1.5 rounded-lg ${wide ? "px-2 flex-shrink-0" : "flex-1"}`}
      style={{
        fontSize: 12, fontWeight: 600,
        backgroundColor: selected ? "#1A73E8" : "#F1F3F4",
        color: selected ? "white" : "#5F6368",
      }}
    >
      {label}
    </button>
  );
}
