import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Building2, CalendarDays, ChevronRight, MapPin, Search, X } from "lucide-react";
import type { Course } from "../types";
import { CAMPUS_BUILDINGS } from "../data/campus";
import { searchPlaces, type Place } from "../data/places";
import { formatSlot } from "../lib/schedule";
import { tokenize } from "../lib/search";
import { Highlight } from "./Highlight";

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
          <p style={{ fontSize: 16, fontWeight: 700, color: "#202124" }}>教室・棟を探す</p>
        </div>
      </div>

      {/* 検索欄・結果をまとめてスクロールさせる(上に固定するのは画面タイトルだけ) */}
      <div className="flex-1 overflow-y-auto">
        {/* 検索欄 */}
        <div className="px-5 pt-2 pb-4 space-y-3" style={{ borderBottom: "1px solid #E8EAED" }}>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: "#F1F3F4" }}>
              <MapPin size={15} color="#80868B" />
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) search(); }}
                enterKeyHint="search"
                placeholder="例:104、学部棟" aria-label="教室名・棟の名前"
                className="flex-1 min-w-0 bg-transparent outline-none"
                style={{ fontSize: 14, color: "#202124" }}
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="入力を消す">
                  <X size={14} color="#80868B" />
                </button>
              )}
            </div>
            <button
              onClick={() => search()}
              className="flex items-center gap-1 px-4 rounded-xl flex-shrink-0"
              style={{ backgroundColor: "#1A73E8" }}
            >
              <Search size={15} color="white" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>検索</span>
            </button>
          </div>

          {/* 文字を打たずに棟から探せるようにする */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#80868B", marginBottom: 6 }}>棟から探す</p>
            <div className="flex flex-wrap gap-1.5">
              {CAMPUS_BUILDINGS.map(b => {
                const selected = submitted.trim() === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => search(b.id)}
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      fontSize: 13, fontWeight: 600,
                      backgroundColor: selected ? "#1A73E8" : "#F1F3F4",
                      color: selected ? "white" : "#5F6368",
                    }}
                  >
                    {b.id}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 検索結果 */}
        <div className="pb-8">
          {tokens.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 px-8 text-center">
              <MapPin size={28} color="#DADCE0" />
              <p style={{ fontSize: 13, color: "#80868B", lineHeight: 1.6 }}>
                教室名や棟の名前を入れて「検索」を押すか、<br />上の棟を選んでください
              </p>
            </div>
          ) : (
            <>
              <p className="px-5 py-2" style={{ fontSize: 12, fontWeight: 700, color: "#5F6368", backgroundColor: "#F8F9FA", borderBottom: "1px solid #E8EAED" }}>
                {results.length}件
              </p>

              {groups.map(g => (
                <section key={g.building}>
                  {/* 棟の見出し。タップでその棟の地図を開く */}
                  <button
                    onClick={() => onSelectPlace(g.buildingHit ?? { key: `b-${g.building}`, title: g.building, building: g.building })}
                    className="w-full flex items-center gap-2 px-5 py-2.5 text-left"
                    style={{ backgroundColor: "#E8F0FE" }}
                    aria-label={`${g.building}を地図で見る`}
                  >
                    <Building2 size={16} color="#1A73E8" />
                    <span className="flex-1" style={{ fontSize: 14, fontWeight: 700, color: "#1A73E8" }}>
                      <Highlight text={g.building} tokens={tokens} />
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1A73E8" }}>棟を地図で見る</span>
                    <ChevronRight size={16} color="#1A73E8" />
                  </button>

                  {g.rooms.map(p => {
                    const using = coursesIn(p);
                    return (
                      <button
                        key={p.key}
                        onClick={() => onSelectPlace(p)}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left active:bg-gray-50"
                        aria-label={`${p.building} ${p.floor}F ${p.title}を地図で見る`}
                        style={{ borderBottom: "1px solid #F1F3F4" }}
                      >
                        <MapPin size={16} color="#EA4335" className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: 15, fontWeight: 700, color: "#202124" }}>
                            <Highlight text={p.title} tokens={tokens} />
                            <span style={{ fontSize: 12, fontWeight: 400, color: "#80868B" }}>　{p.floor}F</span>
                          </p>
                          {using.map(c => (
                            <p key={c.id} className="flex items-center gap-1 truncate" style={{ fontSize: 11, color: "#188038" }}>
                              <CalendarDays size={11} color="#188038" className="flex-shrink-0" />
                              時間割:{c.name}({formatSlot(c.day, c.period)})
                            </p>
                          ))}
                        </div>
                        <ChevronRight size={16} color="#9AA0A6" className="flex-shrink-0" />
                      </button>
                    );
                  })}
                </section>
              ))}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
