import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import type { Course, Destination, NewCourse } from "./types";
import { Timetable } from "./components/Timetable";
import { CampusMap } from "./components/CampusMap";
import { FloorMap } from "./components/FloorMap";
import { CourseSearchScreen } from "./components/CourseSearchScreen";
import { CourseEditScreen } from "./components/CourseEditScreen";
import { CampusSearchScreen } from "./components/CampusSearchScreen";
import { ConfirmDialog } from "./components/ConfirmDialog";
import type { Place } from "./data/places";
import { formatSlot } from "./lib/schedule";

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
  { id:"c7",  name:"ビジネス英語",                  building:"学部棟",  floor:1, roomNumber:"104",  professor:"Smith 講師", period:1, day:3, color:"#6EE7B7" },
  { id:"c8",  name:"国際経済論",                    building:"研究棟B", floor:2, roomNumber:"205",  professor:"中村 教授",   period:3, day:3, color:"#FCA5A5" },
  { id:"c9",  name:"データ分析",                    building:"研究棟A", floor:1, roomNumber:"103",  professor:"渡辺 准教授", period:2, day:4, color:"#93C5FD" },
  { id:"c10", name:"経営戦略論",                    building:"学部棟",  floor:3, roomNumber:"301",  professor:"小林 教授",   period:4, day:4, color:"#FDE68A" },
];

type Screen = "timetable" | "search" | "edit" | "campusSearch" | "campus" | "floor";

// 2.4.2 ページタイトル:画面ごとにタブ・読み上げのタイトルを変える
const SCREEN_TITLES: Record<Screen, string> = {
  timetable: "時間割",
  search: "授業を検索/登録する",
  edit: "講義を編集",
  campusSearch: "教室・棟を探す",
  campus: "キャンパスマップ",
  floor: "フロアマップ",
};

// 開いている行き先。courseId で講義を引き直す(編集が反映されるように)。from はキャンパスマップから戻る先
type Target = { destination: Destination; courseId?: string; from: Screen };

export default function App() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [target, setTarget] = useState<Target | null>(null);
  const [screen, setScreen] = useState<Screen>("timetable");
  const [editMode, setEditMode] = useState(false);
  // 授業を検索/登録する画面を空きコマから開いたときの曜日・時限
  const [searchSlot, setSearchSlot] = useState<{ day?: number; period?: number }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  // キャンパス自由検索で最後に検索した語(地図から戻ったときに結果を出し直す)
  const [campusQuery, setCampusQuery] = useState("");
  // 削除の確認ダイアログで確認中の講義
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null);
  // 4.1.3 ステータスメッセージ:登録・保存・削除の結果を画面に出し、読み上げもする
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  const noticeTimer = useRef<number>();

  const announce = (text: string) => {
    setNotice({ id: Date.now(), text });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 5000);
  };

  useEffect(() => {
    document.title = `${SCREEN_TITLES[screen]} | キャンパス授業ナビ`;
  }, [screen]);

  const addCourse = (data: NewCourse) => {
    const color = COLORS[courses.length % COLORS.length];
    setCourses(p => [...p, { ...data, id: `c${Date.now()}`, color }]);
  };

  const updateCourse = (id: string, data: NewCourse) =>
    setCourses(p => p.map(c => (c.id === id ? { ...c, ...data } : c)));

  const deleteCourse = (c: Course) => {
    setCourses(p => p.filter(x => x.id !== c.id));
    announce(`「${c.name}」(${formatSlot(c.day, c.period)})を時間割から削除しました`);
  };

  const openCourse = (c: Course) => {
    setTarget({ destination: { building: c.building, floor: c.floor, roomNumber: c.roomNumber }, courseId: c.id, from: "timetable" });
    setScreen("campus");
  };

  const openPlace = (p: Place) => {
    setTarget({ destination: { building: p.building, floor: p.floor, roomNumber: p.roomNumber }, from: "campusSearch" });
    setScreen("campus");
  };

  const openSearch = (day?: number, period?: number) => {
    setSearchSlot({ day, period });
    setScreen("search");
  };

  const openEdit = (c: Course) => {
    setEditingId(c.id);
    setScreen("edit");
  };

  const backToTimetable = () => setScreen("timetable");

  const course = target?.courseId ? courses.find(c => c.id === target.courseId) : undefined;
  const editing = editingId ? courses.find(c => c.id === editingId) : undefined;

  return (
    <MotionConfig reducedMotion="user">
    <div
      className="flex items-center justify-center min-h-screen bg-gray-400"
      style={{ fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif" }}
    >
      <div className="phone-frame relative bg-white overflow-hidden">
        {/* Status bar(端末の見た目を再現した飾りなので、支援技術からは隠す) */}
        <div
          className="device-chrome absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8"
          style={{ height: 44, pointerEvents: "none" }}
          aria-hidden="true"
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
                editMode={editMode}
                onToggleEditMode={() => setEditMode(e => !e)}
                onSelectCourse={openCourse}
                onOpenSearch={openSearch}
                onOpenCampusSearch={() => { setCampusQuery(""); setScreen("campusSearch"); }}
                onEditCourse={openEdit}
                onDeleteCourse={setPendingDelete}
              />
            )}
            {screen === "search" && (
              <CourseSearchScreen
                key="search"
                existingCourses={courses}
                initialDay={searchSlot.day}
                initialPeriod={searchSlot.period}
                onRegister={data => {
                  addCourse(data);
                  backToTimetable();
                  announce(`「${data.name}」を${formatSlot(data.day, data.period)}に登録しました`);
                }}
                onBack={backToTimetable}
              />
            )}
            {screen === "edit" && editing && (
              <CourseEditScreen
                key="edit"
                existingCourses={courses}
                editing={editing}
                onSubmit={data => {
                  updateCourse(editing.id, data);
                  backToTimetable();
                  announce(`「${data.name}」の変更を保存しました`);
                }}
                onBack={backToTimetable}
              />
            )}
            {screen === "campusSearch" && (
              <CampusSearchScreen
                key="campusSearch"
                courses={courses}
                initialQuery={campusQuery}
                onSearch={setCampusQuery}
                onSelectPlace={openPlace}
                onBack={backToTimetable}
              />
            )}
            {screen === "campus" && target && (
              <CampusMap
                key="cm"
                destination={target.destination}
                course={course}
                onBack={() => { setScreen(target.from); setTarget(null); }}
                onEnterBuilding={() => setScreen("floor")}
              />
            )}
            {screen === "floor" && target && (
              <FloorMap
                key="fm"
                destination={target.destination}
                course={course}
                onBack={() => setScreen("campus")}
              />
            )}
          </AnimatePresence>
        </div>

        {/* 登録・保存・削除の結果(画面下に5秒出し、role="status" で読み上げる) */}
        <div className="absolute left-4 right-4 bottom-8 z-40 flex justify-center pointer-events-none" role="status" aria-live="polite">
          <AnimatePresence>
            {notice && (
              <motion.p
                key={notice.id}
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ backgroundColor: "#202124", color: "white", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                <CheckCircle2 size={18} color="#81C995" aria-hidden="true" />
                {notice.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 講義を削除する前の確認 */}
        <AnimatePresence>
          {pendingDelete && (
            <ConfirmDialog
              title="講義を削除しますか?"
              description={`「${pendingDelete.name}」(${formatSlot(pendingDelete.day, pendingDelete.period)})を時間割から削除します。この操作は取り消せません。`}
              confirmLabel="削除する"
              onConfirm={() => { deleteCourse(pendingDelete); setPendingDelete(null); }}
              onCancel={() => setPendingDelete(null)}
            />
          )}
        </AnimatePresence>

        {/* Home indicator(飾り) */}
        <div
          className="device-chrome absolute bottom-2 left-0 right-0 flex justify-center"
          style={{ pointerEvents: "none", zIndex: 50 }}
          aria-hidden="true"
        >
          <div className="bg-black rounded-full" style={{ width: 134, height: 5, opacity: 0.2 }} />
        </div>
      </div>
    </div>
    </MotionConfig>
  );
}
