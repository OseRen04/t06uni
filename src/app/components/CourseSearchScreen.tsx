import { useState } from "react";
import { motion } from "motion/react";
import { Check, Plus, Search, User } from "lucide-react";
import type { Course, NewCourse } from "../types";
import { CATALOG } from "../data/catalog";
import { generateMockCourses, type SearchCriteria } from "../data/mockCourses";
import { DAYS, PERIODS, formatDay, formatLocation, formatPeriod, formatPeriodTime, formatSlot } from "../lib/schedule";
import { tokenize } from "../lib/search";
import { Highlight } from "./Highlight";
import { Chip, ChipGroup, ScreenHeader, TextField } from "./common";

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
      <ScreenHeader title="授業を検索/登録する" onBack={onBack} backLabel="時間割に戻る" divider={false} />

      {/* 検索条件・件数・結果をまとめてスクロールさせる(上に固定するのは画面タイトルだけ) */}
      <div className="flex-1 overflow-y-auto">
        {/* 検索条件 */}
        <form
          role="search"
          aria-label="授業の検索条件"
          className="px-5 pt-1 pb-4 space-y-3"
          style={{ borderBottom: "1px solid #DADCE0" }}
          onSubmit={e => { e.preventDefault(); search(); }}
        >
          <div className="flex gap-2">
            <TextField label="授業名" value={name} onChange={setName} placeholder="例:経済" icon={<Search size={15} color="#5F6368" />} />
            <TextField label="教員名" value={professor} onChange={setProfessor} placeholder="例:田中" icon={<User size={15} color="#5F6368" />} />
          </div>

          <ChipGroup label="曜日" inline>
            <Chip label="すべて" selected={day === null} onClick={() => setDay(null)} ariaLabel="曜日はすべて" />
            {DAYS.map((d, i) => (
              <Chip key={i} label={d} selected={day === i} onClick={() => setDay(i)} grow ariaLabel={formatDay(i)} />
            ))}
          </ChipGroup>

          <ChipGroup label="コマ" inline>
            <Chip label="すべて" selected={period === null} onClick={() => setPeriod(null)} ariaLabel="コマはすべて" />
            {PERIODS.map(({ period: p }) => (
              <Chip key={p} label={formatPeriod(p)} selected={period === p} onClick={() => setPeriod(p)} grow />
            ))}
          </ChipGroup>

          <div className="flex items-center gap-2 pt-1">
            {(hasCondition || submitted) && (
              <button
                type="button"
                onClick={clearAll}
                className="flex-shrink-0 px-3 rounded-xl"
                style={{ minHeight: 44, fontSize: 14, fontWeight: 700, color: "#1967D2", border: "1px solid #80868B" }}
              >
                条件をクリア
              </button>
            )}
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl"
              style={{ minHeight: 44, backgroundColor: "#1967D2" }}
            >
              <Search size={16} color="white" aria-hidden="true" />
              <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>検索</span>
            </button>
          </div>
        </form>

        {/* 件数(検索のたびに読み上げる)と絞り込みの切り替え */}
        <div role="status" aria-live="polite">
          {submitted && (
            <div className="flex items-center gap-3 px-5 py-2" style={{ backgroundColor: "#F8F9FA", borderBottom: "1px solid #DADCE0" }}>
              <p className="flex-1" style={{ fontSize: 13, fontWeight: 700, color: "#3C4043" }}>
                検索結果 {total}件
                {hiddenCount > 0 && (
                  <span style={{ fontWeight: 400, color: "#5F6368" }}>(登録済みの{hiddenCount}コマは非表示)</span>
                )}
              </p>
              <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 13, color: "#3C4043", minHeight: 32 }}>
                <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#1967D2" }} />
                空きコマのみ
              </label>
            </div>
          )}
        </div>

        {/* 検索結果(曜日・時限ごと) */}
        <div className="pb-8">
          {!submitted && (
            <div className="flex flex-col items-center gap-2 py-12 px-8 text-center">
              <Search size={28} color="#80868B" aria-hidden="true" />
              <p style={{ fontSize: 14, color: "#3C4043", lineHeight: 1.6 }}>
                授業名・教員名・曜日・コマを指定して<br />「検索」を押してください
              </p>
              <p style={{ fontSize: 12, color: "#5F6368" }}>何も指定せずに検索すると、すべての授業を表示します</p>
            </div>
          )}

          {submitted && visible.length === 0 && (
            <div className="py-10 text-center">
              <p style={{ fontSize: 14, color: "#3C4043" }}>空いているコマに該当する授業がありません</p>
              {hiddenCount > 0 && (
                <button onClick={() => setFreeOnly(false)} className="mt-2 px-3 rounded-xl" style={{ minHeight: 40, fontSize: 14, fontWeight: 700, color: "#1967D2" }}>
                  登録済みのコマも表示する
                </button>
              )}
            </div>
          )}

          {visible.map(g => (
            <section key={`${g.day}-${g.period}`} aria-labelledby={`slot-${g.day}-${g.period}`}>
              <h2
                id={`slot-${g.day}-${g.period}`}
                className="flex items-center gap-2 px-5 py-2"
                style={{ backgroundColor: g.occupant ? "#F1F3F4" : "#E8F0FE" }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: g.occupant ? "#3C4043" : "#185ABC" }}>
                  {formatSlot(g.day, g.period)}
                </span>
                <span style={{ fontSize: 12, color: "#5F6368" }}>{formatPeriodTime(g.period)}</span>
                <span className="flex-1 truncate text-right" style={{ fontSize: 12, fontWeight: 700, color: g.occupant ? "#3C4043" : "#185ABC" }}>
                  {g.occupant ? `登録済み:${g.occupant.name}` : "空き"}
                </span>
              </h2>

              <ul>
                {g.courses.map((c, i) => {
                  const registered = g.occupant?.name === c.name;
                  const blocked = !!g.occupant && !registered;
                  return (
                    <li key={`${i}-${c.name}`} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid #E8EAED" }}>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 15, fontWeight: 700, color: blocked ? "#5F6368" : "#202124" }}>
                          <Highlight text={c.name} tokens={nameTokens} />
                        </p>
                        <p style={{ fontSize: 13, color: "#5F6368" }}>
                          <Highlight text={c.professor} tokens={professorTokens} />
                          <span aria-hidden="true"> · </span>
                          <span className="sr-only">、</span>
                          {formatLocation(c)}
                        </p>
                      </div>
                      {registered ? (
                        <span className="flex items-center gap-1 flex-shrink-0" style={{ fontSize: 13, fontWeight: 700, color: "#188038" }}>
                          <Check size={16} color="#188038" aria-hidden="true" />登録済み
                        </span>
                      ) : blocked ? (
                        // 埋まっているコマは登録できないことを文字で示す(薄くするだけにしない)
                        <span className="flex-shrink-0" style={{ fontSize: 12, color: "#5F6368" }}>このコマは埋まっています</span>
                      ) : (
                        <button
                          onClick={() => onRegister(c)}
                          className="flex items-center gap-1 px-3 rounded-xl flex-shrink-0"
                          style={{ minHeight: 40, backgroundColor: "#1967D2" }}
                          aria-label={`登録:${c.name}(${formatSlot(c.day, c.period)})`}
                        >
                          <Plus size={16} color="white" aria-hidden="true" />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>登録</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
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
