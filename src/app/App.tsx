import { useState } from "react";
import { AnimatePresence } from "motion/react";
import type { Course } from "./types";
import { Timetable } from "./components/Timetable";
import { CampusMap } from "./components/CampusMap";
import { FloorMap } from "./components/FloorMap";

export type { Course };

const COLORS = [
  "#F9A8D4","#93C5FD","#86EFAC","#FDE68A","#C4B5FD",
  "#FCA5A5","#6EE7B7","#FCD34D","#A5B4FC","#FDBA74",
];

const INITIAL_COURSES: Course[] = [
  { id:"c1",  name:"マーケティング・マネジメント", building:"学部棟",  floor:2, roomNumber:"203",  professor:"田中 教授",   period:1, day:0, color:"#F9A8D4" },
  { id:"c2",  name:"経営学概論",                   building:"学部棟",  floor:3, roomNumber:"302",  professor:"佐藤 教授",   period:2, day:0, color:"#93C5FD" },
  { id:"c3",  name:"情報処理入門",                  building:"研究棟A", floor:1, roomNumber:"105",  professor:"山田 准教授", period:1, day:1, color:"#86EFAC" },
  { id:"c4",  name:"統計学",                        building:"学部棟",  floor:2, roomNumber:"201",  professor:"鈴木 教授",   period:3, day:1, color:"#FDE68A" },
  { id:"c5",  name:"組織行動論",                    building:"学部棟",  floor:3, roomNumber:"304",  professor:"高橋 教授",   period:2, day:2, color:"#C4B5FD" },
  { id:"c6",  name:"会計学基礎",                    building:"図書館",  floor:1, roomNumber:"L101", professor:"伊藤 教授",   period:4, day:2, color:"#FCA5A5" },
  { id:"c7",  name:"ビジネス英語",                  building:"学部棟",  floor:1, roomNumber:"106",  professor:"Smith 講師", period:1, day:3, color:"#6EE7B7" },
  { id:"c8",  name:"国際経済論",                    building:"研究棟B", floor:2, roomNumber:"205",  professor:"中村 教授",   period:3, day:3, color:"#FCA5A5" },
  { id:"c9",  name:"データ分析",                    building:"研究棟A", floor:1, roomNumber:"103",  professor:"渡辺 准教授", period:2, day:4, color:"#93C5FD" },
  { id:"c10", name:"経営戦略論",                    building:"学部棟",  floor:3, roomNumber:"301",  professor:"小林 教授",   period:4, day:4, color:"#FDE68A" },
];

type Screen = "timetable" | "campus" | "floor";

export default function App() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [selected, setSelected] = useState<Course | null>(null);
  const [screen, setScreen] = useState<Screen>("timetable");

  const addCourse = (data: Omit<Course, "id" | "color">) => {
    const color = COLORS[courses.length % COLORS.length];
    setCourses(p => [...p, { ...data, id: `c${Date.now()}`, color }]);
  };

  const deleteCourse = (id: string) => setCourses(p => p.filter(c => c.id !== id));

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gray-400"
      style={{ fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif" }}
    >
      <div
        className="relative bg-white overflow-hidden"
        style={{ width: 390, height: 844, borderRadius: 44, boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}
      >
        {/* Status bar */}
        <div
          className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8"
          style={{ height: 44, pointerEvents: "none" }}
        >
          <span style={{ fontSize: 15, fontWeight: 600 }}>9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5 items-end" style={{ height: 14 }}>
              {[3, 5, 7, 9, 11].map((h, i) => (
                <div key={i} className="w-1 bg-black rounded-sm" style={{ height: h, opacity: i < 4 ? 1 : 0.3 }} />
              ))}
            </div>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
              <path d="M7.5 2C9.4 2 11.1 2.8 12.4 4L13.8 2.5C12.1.9 9.9 0 7.5 0S2.9.9 1.2 2.5L2.6 4C3.9 2.8 5.6 2 7.5 2Z" fill="black"/>
              <path d="M7.5 5C8.9 5 10.1 5.5 11 6.4L12.4 4.9C11.1 3.7 9.4 3 7.5 3S3.9 3.7 2.6 4.9L4 6.4C4.9 5.5 6.1 5 7.5 5Z" fill="black"/>
              <circle cx="7.5" cy="9" r="2" fill="black"/>
            </svg>
            <div className="flex items-center gap-0.5">
              <div className="w-6 h-3 rounded-sm border border-black flex items-center pl-0.5">
                <div className="w-4 h-2 rounded-sm bg-black" />
              </div>
              <div className="w-0.5 h-1.5 bg-black rounded-sm" />
            </div>
          </div>
        </div>

        {/* App content */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {screen === "timetable" && (
              <Timetable
                key="tt"
                courses={courses}
                onSelectCourse={c => { setSelected(c); setScreen("campus"); }}
                onDeleteCourse={deleteCourse}
                onAddCourse={addCourse}
              />
            )}
            {screen === "campus" && selected && (
              <CampusMap
                key="cm"
                course={selected}
                onBack={() => { setScreen("timetable"); setSelected(null); }}
                onEnterBuilding={() => setScreen("floor")}
              />
            )}
            {screen === "floor" && selected && (
              <FloorMap
                key="fm"
                course={selected}
                onBack={() => setScreen("campus")}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Home indicator */}
        <div
          className="absolute bottom-2 left-0 right-0 flex justify-center"
          style={{ pointerEvents: "none", zIndex: 50 }}
        >
          <div className="bg-black rounded-full" style={{ width: 134, height: 5, opacity: 0.2 }} />
        </div>
      </div>
    </div>
  );
}
