import { createContext, useContext, useState, type ReactNode } from "react";
import type { Course, NewCourse } from "@/types";

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

type CoursesContextValue = {
  courses: Course[];
  addCourse: (data: NewCourse) => void;
  updateCourse: (id: string, data: NewCourse) => void;
  deleteCourse: (id: string) => void;
};

const CoursesContext = createContext<CoursesContextValue | null>(null);

// 授業データはメモリ上だけで保持する(アプリを再起動すると初期状態に戻る)
export function CoursesProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);

  const addCourse = (data: NewCourse) => {
    const color = COLORS[courses.length % COLORS.length];
    setCourses(p => [...p, { ...data, id: `c${Date.now()}`, color }]);
  };

  const updateCourse = (id: string, data: NewCourse) =>
    setCourses(p => p.map(c => (c.id === id ? { ...c, ...data } : c)));

  const deleteCourse = (id: string) => setCourses(p => p.filter(c => c.id !== id));

  return (
    <CoursesContext.Provider value={{ courses, addCourse, updateCourse, deleteCourse }}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const ctx = useContext(CoursesContext);
  if (!ctx) throw new Error("useCourses must be used inside CoursesProvider");
  return ctx;
}
