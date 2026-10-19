// キャンパスマップのデータと経路探索。
// 座標はすべて地図 SVG の座標系(viewBox 0 0 390 560、北が上)

export type Point = { x: number; y: number };

export type CampusBuilding = {
  id: string;
  x: number; y: number; w: number; h: number;
  labelX: number; labelY: number;
  pinX: number; pinY: number; // pin tip = top-center of building
  door: Point;                // 建物の入口
  access: Point;              // 入口につながる道路上の点
  hasClassrooms: boolean;     // 講義の登録先として選べる建物か
};

export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  { id: "学部棟",   x: 120, y: 150, w: 52, h: 128, labelX: 146, labelY: 214, pinX: 146, pinY: 134, door: { x: 120, y: 214 }, access: { x: 117, y: 214 }, hasClassrooms: true },
  { id: "図書館",   x: 20,  y: 150, w: 82, h: 58,  labelX: 61,  labelY: 179, pinX: 61,  pinY: 134, door: { x: 61,  y: 150 }, access: { x: 61,  y: 140 }, hasClassrooms: true },
  { id: "研究棟A",  x: 290, y: 150, w: 78, h: 52,  labelX: 329, labelY: 176, pinX: 329, pinY: 134, door: { x: 329, y: 150 }, access: { x: 329, y: 140 }, hasClassrooms: true },
  { id: "研究棟B",  x: 290, y: 218, w: 78, h: 64,  labelX: 329, labelY: 250, pinX: 329, pinY: 202, door: { x: 290, y: 250 }, access: { x: 271, y: 250 }, hasClassrooms: true },
  { id: "体育館",   x: 18,  y: 325, w: 76, h: 80,  labelX: 56,  labelY: 365, pinX: 56,  pinY: 309, door: { x: 94,  y: 365 }, access: { x: 117, y: 365 }, hasClassrooms: true },
  { id: "食堂",     x: 215, y: 325, w: 70, h: 54,  labelX: 250, labelY: 352, pinX: 250, pinY: 309, door: { x: 250, y: 325 }, access: { x: 250, y: 310 }, hasClassrooms: false },
  { id: "学生会館", x: 215, y: 395, w: 70, h: 54,  labelX: 250, labelY: 422, pinX: 250, pinY: 379, door: { x: 250, y: 449 }, access: { x: 250, y: 466 }, hasClassrooms: false },
  { id: "講義棟",   x: 120, y: 295, w: 52, h: 54,  labelX: 146, labelY: 322, pinX: 146, pinY: 279, door: { x: 172, y: 322 }, access: { x: 195, y: 322 }, hasClassrooms: true },
];

export const CLASSROOM_BUILDINGS = CAMPUS_BUILDINGS.filter(b => b.hasClassrooms).map(b => b.id);

export const findBuilding = (id: string) => CAMPUS_BUILDINGS.find(b => b.id === id);

/** 正門。GPS が使えないときはここを現在地の代わりにする */
export const GATE: Point = { x: 195, y: 510 };

// 道路の中心線(地図に描いている白い道路と同じ位置)
type Segment = { a: Point; b: Point };
const ROADS: Segment[] = [
  { a: { x: 195, y: 0 },   b: { x: 195, y: 560 } }, // Main vertical
  { a: { x: 0,   y: 140 }, b: { x: 390, y: 140 } }, // Upper horizontal
  { a: { x: 0,   y: 310 }, b: { x: 390, y: 310 } }, // Middle horizontal
  { a: { x: 0,   y: 466 }, b: { x: 390, y: 466 } }, // Lower horizontal
  { a: { x: 117, y: 140 }, b: { x: 117, y: 420 } }, // Left vertical
  { a: { x: 271, y: 140 }, b: { x: 271, y: 330 } }, // Right vertical
];

// ---- GPS の緯度経度 → 地図座標 ----

export type GeoBounds = { north: number; south: number; west: number; east: number };

/**
 * 地図の四辺に当たる緯度経度(地図は北が上)。
 * 実際のキャンパスに合わせて値を入れると、GPS の現在地が地図上に表示される。
 * null のあいだは現在地の代わりに正門を起点にする。
 */
export const CAMPUS_GEO: GeoBounds | null = null;

/** 緯度経度を地図座標に変換する。キャンパスの外なら null */
export function geoToMap(lat: number, lng: number, geo: GeoBounds): Point | null {
  const x = ((lng - geo.west) / (geo.east - geo.west)) * 390;
  const y = ((geo.north - lat) / (geo.north - geo.south)) * 560;
  if (x < 0 || x > 390 || y < 0 || y > 560) return null;
  return { x, y };
}

// ---- 経路探索(道路の上だけを通る最短経路) ----

const EPS = 0.5;
const key = (p: Point) => `${Math.round(p.x * 10) / 10},${Math.round(p.y * 10) / 10}`;
const dist = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y);

function closestOnSegment(p: Point, s: Segment): Point {
  const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
  const t = Math.max(0, Math.min(1, ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / (dx * dx + dy * dy)));
  return { x: s.a.x + t * dx, y: s.a.y + t * dy };
}

const onSegment = (p: Point, s: Segment) => dist(p, closestOnSegment(p, s)) < EPS;

function intersection(s: Segment, t: Segment): Point | null {
  // 道路は水平か垂直だけなので、その組み合わせだけ扱う
  const sv = s.a.x === s.b.x, tv = t.a.x === t.b.x;
  if (sv === tv) return null;
  const [v, h] = sv ? [s, t] : [t, s];
  const p = { x: v.a.x, y: h.a.y };
  return onSegment(p, s) && onSegment(p, t) ? p : null;
}

/** 現在地に一番近い道路上の点 */
export function snapToRoad(p: Point): Point {
  return ROADS.map(s => closestOnSegment(p, s)).reduce((best, q) => (dist(p, q) < dist(p, best) ? q : best));
}

export type Route = { points: Point[]; length: number };

/** from から建物の入口までの経路(道路に沿った最短経路) */
export function findRoute(from: Point, building: CampusBuilding): Route {
  const start = snapToRoad(from);

  // 交差点・始点・建物の入口前を、それぞれが乗っている道路上の節点にする
  const pois: Point[] = [start, building.access];
  ROADS.forEach((s, i) => {
    pois.push(s.a, s.b);
    ROADS.slice(i + 1).forEach(t => {
      const p = intersection(s, t);
      if (p) pois.push(p);
    });
  });

  const graph = new Map<string, { p: Point; edges: { to: string; w: number }[] }>();
  const node = (p: Point) => {
    const k = key(p);
    if (!graph.has(k)) graph.set(k, { p, edges: [] });
    return k;
  };
  for (const s of ROADS) {
    const onThis = pois
      .filter(p => onSegment(p, s))
      .sort((p, q) => dist(s.a, p) - dist(s.a, q));
    for (let i = 1; i < onThis.length; i++) {
      const a = node(onThis[i - 1]), b = node(onThis[i]);
      const w = dist(onThis[i - 1], onThis[i]);
      if (a === b) continue;
      graph.get(a)!.edges.push({ to: b, w });
      graph.get(b)!.edges.push({ to: a, w });
    }
  }

  // Dijkstra(節点は数十個なので単純な実装で十分)
  const startKey = node(start), goalKey = node(building.access);
  const d = new Map<string, number>([[startKey, 0]]);
  const prev = new Map<string, string>();
  const done = new Set<string>();
  while (true) {
    let cur: string | null = null;
    for (const [k, v] of d) if (!done.has(k) && (cur === null || v < d.get(cur)!)) cur = k;
    if (cur === null || cur === goalKey) break;
    done.add(cur);
    for (const e of graph.get(cur)!.edges) {
      const nd = d.get(cur)! + e.w;
      if (nd < (d.get(e.to) ?? Infinity)) { d.set(e.to, nd); prev.set(e.to, cur); }
    }
  }

  const path: Point[] = [];
  for (let k: string | undefined = goalKey; k; k = prev.get(k)) path.unshift(graph.get(k)!.p);
  const points = dedupe([from, ...path, building.door]);
  const length = points.slice(1).reduce((sum, p, i) => sum + dist(points[i], p), 0);
  return { points, length };
}

function dedupe(points: Point[]) {
  return points.filter((p, i) => i === 0 || dist(p, points[i - 1]) >= EPS);
}

export const routeToPath = (r: Route) =>
  r.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

// 地図の 1 単位 ≒ 0.64m、徒歩 80m/分 として計算する
const METERS_PER_UNIT = 0.64;
const WALK_METERS_PER_MIN = 80;

export const walkMinutes = (r: Route) =>
  Math.max(1, Math.ceil((r.length * METERS_PER_UNIT) / WALK_METERS_PER_MIN));
