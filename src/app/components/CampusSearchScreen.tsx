import { useState } from "react";
import { motion } from "motion/react";
import { Building2, CalendarDays, ChevronRight, MapPin, Search } from "lucide-react";
import type { Course } from "../types";
import { CAMPUS_BUILDINGS } from "../data/campus";
import { searchPlaces, type Place } from "../data/places";
import { formatSlot } from "../lib/schedule";
import { tokenize } from "../lib/search";
import { Highlight } from "./Highlight";
import { Chip, ChipGroup, ScreenHeader, TextField } from "./common";

type Props = {
  courses: Course[];
  initialQuery: string;             // 地図から戻ってきたときに、前の検索結果を出し直すため
  onSearch: (q: string) => void;
  onSelectPlace: (p: Place) => void;
  onBack: () => void;
};

// キャンパス自由検索の画面:教室名・棟の名前で探し、結果からキャンパスマップを開く
export function CampusSearchScreen({ courses, initialQuery, onSearch, onSelectPlace, onBack }: Props) {
  const [query, setQuery] = useState(initialQuery);
  // 「検索」を押した時点の語。押すまでは結果を出さない
  const [submitted, setSubmitted] = useState(initialQuery);

  const search = (q = query) => {
    setQuery(q);
    setSubmitted(q);
    onSearch(q);
  };

  const results = searchPlaces(submitted, courses);
  const tokens = tokenize(submitted);

  // 棟ごとにまとめる(棟そのものが結果になくても、その棟の教室があれば見出しを作る)
  const groups: { building: string; buildingHit: Place | undefined; rooms: Place[] }[] = [];
  for (const p of results) {
    let g = groups.find(x => x.building === p.building);
    if (!g) { g = { building: p.building, buildingHit: undefined, rooms: [] }; groups.push(g); }
    if (p.roomNumber) g.rooms.push(p);
    else g.buildingHit = p;
  }

  // 時間割に登録している授業のうち、その教室を使うもの
  const coursesIn = (p: Place) =>
    courses.filter(c => c.building === p.building && c.floor === p.floor && c.roomNumber === p.roomNumber);

  return (
    <motion.div
      className="flex flex-col h-full bg-white"
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
    >
      <ScreenHeader title="教室・棟を探す" onBack={onBack} backLabel="時間割に戻る" divider={false} />

      {/* 検索欄・結果をまとめてスクロールさせる(上に固定するのは画面タイトルだけ) */}
      <div className="flex-1 overflow-y-auto">
        {/* 検索欄 */}
        <div className="px-5 pt-1 pb-4 space-y-4" style={{ borderBottom: "1px solid #DADCE0" }}>
          <form role="search" aria-label="教室・棟の検索" className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); search(); }}>
            <TextField label="教室名・棟の名前" value={query} onChange={setQuery} placeholder="例:104、学部棟" icon={<MapPin size={16} color="#5F6368" />} />
            <button
              type="submit"
              className="flex items-center gap-1 px-4 rounded-xl flex-shrink-0"
              style={{ minHeight: 46, backgroundColor: "#1967D2" }}
            >
              <Search size={16} color="white" aria-hidden="true" />
              <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>検索</span>
            </button>
          </form>

          {/* 文字を打たずに棟から探せるようにする */}
          <ChipGroup label="棟から探す">
            {CAMPUS_BUILDINGS.map(b => (
              <Chip key={b.id} label={b.id} selected={submitted.trim() === b.id} onClick={() => search(b.id)} />
            ))}
          </ChipGroup>
        </div>

        {/* 検索結果 */}
        <div className="pb-8">
          {/* 件数(検索のたびに読み上げる) */}
          <div role="status" aria-live="polite">
            {tokens.length > 0 && (
              <p className="px-5 py-2" style={{ fontSize: 13, fontWeight: 700, color: "#3C4043", backgroundColor: "#F8F9FA", borderBottom: "1px solid #DADCE0" }}>
                「{submitted.trim()}」の検索結果 {results.length}件
              </p>
            )}
          </div>

          {tokens.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 px-8 text-center">
              <MapPin size={28} color="#80868B" aria-hidden="true" />
              <p style={{ fontSize: 14, color: "#3C4043", lineHeight: 1.6 }}>
                教室名や棟の名前を入れて「検索」を押すか、<br />上の棟を選んでください
              </p>
            </div>
          )}

          {tokens.length > 0 && groups.map(g => (
            <section key={g.building} aria-label={g.building}>
              {/* 棟の見出し。タップでその棟の地図を開く */}
              <h2>
                <button
                  onClick={() => onSelectPlace(g.buildingHit ?? { key: `b-${g.building}`, title: g.building, building: g.building })}
                  className="w-full flex items-center gap-2 px-5 py-3 text-left"
                  style={{ backgroundColor: "#E8F0FE" }}
                >
                  <Building2 size={18} color="#185ABC" aria-hidden="true" />
                  <span className="flex-1" style={{ fontSize: 15, fontWeight: 700, color: "#185ABC" }}>
                    <Highlight text={g.building} tokens={tokens} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#185ABC" }}>棟を地図で見る</span>
                  <ChevronRight size={18} color="#185ABC" aria-hidden="true" />
                </button>
              </h2>

              <ul>
                {g.rooms.map(p => {
                  const using = coursesIn(p);
                  return (
                    <li key={p.key}>
                      <button
                        onClick={() => onSelectPlace(p)}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left active:bg-gray-50"
                        style={{ borderBottom: "1px solid #E8EAED" }}
                      >
                        <MapPin size={18} color="#C5221F" className="flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: 16, fontWeight: 700, color: "#202124" }}>
                            <Highlight text={p.title} tokens={tokens} />
                            <span style={{ fontSize: 13, fontWeight: 400, color: "#5F6368" }}>　{p.floor}F</span>
                            <span className="sr-only">({p.building})。地図で見る</span>
                          </p>
                          {using.map(c => (
                            <p key={c.id} className="flex items-center gap-1" style={{ fontSize: 12, color: "#137333" }}>
                              <CalendarDays size={13} color="#137333" className="flex-shrink-0" aria-hidden="true" />
                              時間割:{c.name}({formatSlot(c.day, c.period)})
                            </p>
                          ))}
                        </div>
                        <ChevronRight size={18} color="#5F6368" className="flex-shrink-0" aria-hidden="true" />
                      </button>
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
