// フロアマップのデータ。座標は地図の幅・高さに対する %(左上が 0,0)

export type Rect = { x: number; y: number; w: number; h: number };

export type FloorRoom = Rect & {
  id: string;
  number: string;   // 教室番号(講義の roomNumber と照合する)
  name?: string;    // 講義室名(例: 11講義室)
  area: string;     // 同じ番号の部屋を見分けるための区画名
  color: string;
};

export type Facility = { kind: "elevator" | "restroom" | "stairs"; x: number; y: number };

export type FloorPlan = {
  building: string;
  floor: number;
  corridors: (Rect & { color?: string })[];
  rooms: FloorRoom[];
  facilities: Facility[];
};

const PINK = "#E8B7CB", TEAL = "#A9D4CF", BLUE = "#AFC4EA";

// 図の色分けがそのまま区画になっている
const AREA: Record<string, string> = { [PINK]: "北西エリア", [TEAL]: "北東エリア", [BLUE]: "南エリア" };

type RoomDef = [number: string, x: number, y: number, w: number, h: number, color: string, name?: string];

const room = ([number, x, y, w, h, color, name]: RoomDef, i: number): FloorRoom =>
  ({ id: `r${i}`, number, name, area: AREA[color] ?? "", x, y, w, h, color });

const GAKUBU_1F: FloorPlan = {
  building: "学部棟",
  floor: 1,
  corridors: [
    { x: 4,  y: 2,  w: 30, h: 39 },
    { x: 48, y: 2,  w: 44, h: 46 },
    { x: 21, y: 43, w: 74, h: 60 },
    { x: 41, y: 82, w: 25, h: 20, color: "#FBF7EF" },
  ],
  rooms: ([
    ["104", 7,  4,  10, 7,  PINK],
    ["103", 22, 4,  11, 7,  PINK],
    ["102", 22, 12, 11, 7,  PINK],
    ["101", 7,  24, 20, 17, PINK, "情報科学講義室"],
    ["107", 50, 4,  16, 10, TEAL],
    ["106B", 50, 24, 8, 8,  TEAL],
    ["106A", 58, 24, 8, 8,  TEAL],
    ["105", 50, 34, 8,  7,  TEAL],
    ["104", 58, 34, 8,  7,  TEAL],
    ["103B", 50, 41, 8, 7,  TEAL],
    ["103A", 58, 41, 8, 7,  TEAL],
    ["101", 72, 10, 18, 16, TEAL, "数学第1講義室"],
    ["102", 72, 26, 18, 15, TEAL],
    ["112", 26, 45, 14, 9,  BLUE],
    ["109", 26, 55, 14, 14, BLUE],
    ["107", 26, 70, 14, 10, BLUE, "12講義室"],
    ["105", 11, 76, 15, 13, BLUE],
    ["104", 11, 86, 30, 10, BLUE, "11講義室"],
    ["120", 43, 46, 11, 8,  BLUE],
    ["119", 43, 58, 9,  5,  BLUE],
    ["130", 55, 58, 10, 4,  BLUE],
    ["125", 65, 58, 4,  4,  BLUE],
    ["126", 69, 58, 4,  4,  BLUE],
    ["133", 55, 63, 11, 12, BLUE],
    ["132", 66, 63, 11, 10, BLUE],
    ["135", 66, 74, 9,  6,  BLUE],
    ["141", 67, 81, 9,  7,  BLUE],
    ["142", 67, 88, 9,  9,  BLUE],
    ["160", 80, 46, 14, 9,  BLUE],
    ["159", 80, 55, 14, 11, BLUE],
    ["157", 80, 66, 14, 10, BLUE],
    ["156", 80, 76, 14, 8,  BLUE],
    ["154", 80, 84, 14, 6,  BLUE],
    ["151", 80, 90, 14, 12, BLUE],
  ] as RoomDef[]).map(room),
  facilities: [
    { kind: "elevator", x: 50, y: 76 },
    { kind: "restroom", x: 53, y: 76 },
    { kind: "stairs",   x: 48, y: 91 },
  ],
};

export const FLOOR_PLANS: FloorPlan[] = [GAKUBU_1F];

export const findFloorPlan = (building: string, floor: number) =>
  FLOOR_PLANS.find(p => p.building === building && p.floor === floor);

/**
 * 教室を探す。roomId があればそれを優先する。
 * 同じ番号の部屋が複数ある階では、講義室名の付いた部屋(講義に使う部屋)を優先する
 */
export function findRoom(plan: FloorPlan, roomNumber?: string, roomId?: string) {
  if (roomId) {
    const byId = plan.rooms.find(r => r.id === roomId);
    if (byId) return byId;
  }
  if (!roomNumber) return undefined;
  const n = roomNumber.trim().toUpperCase();
  const candidates = plan.rooms.filter(r => r.number.toUpperCase() === n);
  return candidates.find(r => r.name) ?? candidates[0];
}

/** フロア図に書く部屋の表示名(例: 「101\n情報科学\n講義室」) */
export function roomLabel(r: FloorRoom) {
  const number = r.number.replace(/^(\d+)([A-Z])$/, "$1\n$2");
  if (!r.name) return number;
  // 「情報科学講義室」→「情報科学\n講義室」のように講義室の前で改行する
  return `${number}\n${r.name.replace(/(.+)(講義室)$/, (_, a, b) => (a.length > 3 ? `${a}\n${b}` : `${a}${b}`))}`;
}
