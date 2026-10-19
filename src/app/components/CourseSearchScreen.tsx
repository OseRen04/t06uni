import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Check, Plus, Search, User, X } from "lucide-react";
import type { Course, NewCourse } from "../types";
import { CATALOG } from "../data/catalog";
import { generateMockCourses, type SearchCriteria } from "../data/mockCourses";
import { DAYS, PERIODS, formatLocation, formatPeriod, formatPeriodTime, formatSlot } from "../lib/schedule";
import { splitByTokens, tokenize } from "../lib/search";

// 検索結果がこれより少ないときは、模擬の授業で補う
const MIN_RESULTS = 3;

type Props = {
  existingCourses: Course[];
  initialDay?: number;     // 時間割の空きコマから開いたときは、その曜日・時限で絞り込んでおく
  initialPeriod?: number;
  onRegister: (data: NewCourse) => void;
  onBack: () => void;
};

// 同じ曜日・時限の授業をまとめたもの
type SlotGroup = { day: number; period: number; courses: NewCourse[]; occupant?: Course };

// 授業登録検索の画面:授業名・曜日・何コマ・教員名で授業一覧を絞り込み、結果からそのまま登録する
export function CourseSearchScreen({ existingCourses, initialDay, initialPeriod, onRegister, onBack }: Props) {
  const [name, setName] = useState("");
  const [day, setDay] = useState<number | null>(initialDay ?? null);
  const [period, setPeriod] = useState<number | null>(initialPeriod ?? null);
  const [professor, setProfessor] = useState("");
  // 登録が目的の画面なので、最初は登録できる(空いている)コマだけを出す
  const [freeOnly, setFreeOnly] = useState(true);

  // 「検索」を押した時点の条件。押すまでは null で、結果は出さない
  const [submitted, setSubmitted] = useState<SearchCriteria | null>(null);

  const occupant = (d: number, p: number) => existingCourses.find(c => c.day === d && c.period === p);
  const hasCondition = name.trim() !== "" || professor.trim() !== "" || day !== null || period !== null;

  const search = () => setSubmitted({ name, professor, day, period });
  const clearAll = () => { setName(""); setDay(null); setPeriod(null); setProfessor(""); setSubmitted(null); };

  const groups = submitted ? searchCourses(submitted, occupant) : [];
  const visible = freeOnly ? groups.filter(g => !g.occupant) : groups;
  const hiddenCount = groups.length - visible.length;
  const total = visible.reduce((n, g) => n + g.courses.length, 0);
  const nameTokens = tokenize(submitted?.name ?? "");
  const professorTokens = tokenize(submitted?.professor ?? "");

  return (
    <motion.div
      className="flex flex-col h-full bg-white"
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
    >
      {/* Header */}
      <div className="bg-white pt-12 pb-2 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            aria-label="時間割に戻る"
          >
            <ArrowLeft size={18} color="#5F6368" />
          </button>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#202124" }}>授業を検索/登録する</p>
        </div>
      </div>

      {/* 検索条件・件数・結果をまとめてスクロールさせる(上に固定するのは画面タイトルだけ) */}
      <div className="flex-1 overflow-y-auto">
        {/* 検索条件 */}
        <div className="px-5 pt-2 pb-3 space-y-2.5" style={{ borderBottom: "1px solid #E8EAED" }}>
          <div className="flex gap-2">
            <SearchInput icon={<Search size={14} color="#80868B" />} label="授業名" value={name} onChange={setName} onEnter={search} />
            <SearchInput icon={<User size={14} color="#80868B" />} label="教員名" value={professor} onChange={setProfessor} onEnter={search} />
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

          <div className="flex items-center gap-3 pt-1">
            {(hasCondition || submitted) && (
              <button onClick={clearAll} className="flex-shrink-0 px-1" style={{ fontSize: 12, fontWeight: 600, color: "#1A73E8" }}>
                条件をクリア
              </button>
            )}
            <button
              onClick={search}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
              style={{ backgroundColor: "#1A73E8" }}
            >
              <Search size={16} color="white" />
              <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>検索</span>
            </button>
          </div>
        </div>

        {/* 件数・絞り込みの切り替え(検索してから出す) */}
        {submitted && (
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
          </div>
        )}

        {/* 検索結果(曜日・時限ごと) */}
        <div className="pb-8">
          {!submitted && (
            <div className="flex flex-col items-center gap-2 py-12 px-8 text-center">
              <Search size={28} color="#DADCE0" />
              <p style={{ fontSize: 13, color: "#80868B", lineHeight: 1.6 }}>
                授業名・教員名・曜日・コマを指定して<br />「検索」を押してください
              </p>
              <p style={{ fontSize: 11, color: "#9AA0A6" }}>何も指定せずに検索すると、すべての授業を表示します</p>
            </div>
          )}

          {submitted && visible.length === 0 && (
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
                className="flex items-center gap-2 px-5 py-1.5"
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
      </div>
    </motion.div>
  );
}

/**
 * 授業一覧から条件に合う授業を探し、曜日・時限ごとにまとめて時間割の順(月1 → 金5)に並べる。
 * モック環境なので、一覧からの該当が少ないときは検索条件どおりの模擬の授業で補い、必ず結果を出す
 */
function searchCourses(c: SearchCriteria, occupant: (d: number, p: number) => Course | undefined): SlotGroup[] {
  const nameTokens = tokenize(c.name);
  const professorTokens = tokenize(c.professor);
  const filtered = nameTokens.length > 0 || professorTokens.length > 0 || c.day !== null || c.period !== null;

  const matched = CATALOG.filter(x =>
    nameTokens.every(t => x.name.toLowerCase().includes(t)) &&
    professorTokens.every(t => x.professor.toLowerCase().includes(t)) &&
    (c.day === null || x.day === c.day) &&
    (c.period === null || x.period === c.period)
  );
  const mocks = filtered && matched.length < MIN_RESULTS
    ? generateMockCourses(c, MIN_RESULTS - matched.length, (d, p) => !occupant(d, p))
    : [];

  const groups: SlotGroup[] = [];
  for (const x of [...matched, ...mocks].sort((a, b) => a.day - b.day || a.period - b.period)) {
    const last = groups[groups.length - 1];
    if (last && last.day === x.day && last.period === x.period) last.courses.push(x);
    else groups.push({ day: x.day, period: x.period, courses: [x], occupant: occupant(x.day, x.period) });
  }
  return groups;
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

function SearchInput({ icon, label, value, onChange, onEnter }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; onEnter: () => void }) {
  return (
    <div className="flex-1 min-w-0 flex items-center gap-1.5 rounded-xl px-2.5 py-2" style={{ backgroundColor: "#F1F3F4" }}>
      {icon}
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) onEnter(); }}
        enterKeyHint="search"
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
