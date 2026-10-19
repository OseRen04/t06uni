export type Course = {
  id: string;
  name: string;
  building: string;
  floor: number;
  roomNumber: string;
  professor: string;
  period: number; // 1–5
  day: number;    // 0=Mon … 4=Fri
  color: string;
};

export type NewCourse = Omit<Course, "id" | "color">;

// キャンパスマップ・フロアマップの行き先。
// 時間割の講義から開くときも、キャンパス自由検索から開くときもこの形で渡す
export type Destination = {
  building: string;
  floor?: number;
  roomNumber?: string;
};
