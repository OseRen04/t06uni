// キャンパス自由検索(教室名・棟の名前)の検索対象
import type { Course } from "../types";
import { formatRoom } from "../lib/schedule";
import { tokenize } from "../lib/search";
import { CAMPUS_BUILDINGS } from "./campus";
import { CATALOG } from "./catalog";
import { mockPlace } from "./mockCourses";

export type Place = {
  key: string;
  title: string;        // 例: 「104号室」「学部棟」
  building: string;
  floor?: number;       // 棟そのものは undefined
  roomNumber?: string;
};

const buildingOrder = (id: string) => {
  const i = CAMPUS_BUILDINGS.findIndex(b => b.id === id);
  return i < 0 ? CAMPUS_BUILDINGS.length : i;
};

/** 棟と、授業一覧・時間割に出てくる教室の一覧 */
function buildPlaces(courses: Course[]): Place[] {
  const places: Place[] = CAMPUS_BUILDINGS.map(b => ({ key: `b-${b.id}`, title: b.id, building: b.id }));
  const seen = new Set<string>();
  for (const c of [...CATALOG, ...courses]) {
    const k = `${c.building}-${c.floor}-${c.roomNumber}`;
    if (seen.has(k)) continue;
    seen.add(k);
    places.push({ key: `r-${k}`, title: formatRoom(c.roomNumber), building: c.building, floor: c.floor, roomNumber: c.roomNumber });
  }
  return places;
}

/**
 * 教室名・棟の名前で探す。結果は棟の順 → 棟そのもの → 階 → 教室番号の順に並べる。
 * モック環境なので、該当がないときは入力した名前の模擬の教室を 1 件返す
 */
export function searchPlaces(q: string, courses: Course[]): Place[] {
  const tokens = tokenize(q);
  if (tokens.length === 0) return [];
  const hits = buildPlaces(courses)
    .filter(p => {
      const texts = [p.title, p.building, p.roomNumber ?? "", p.floor ? `${p.floor}F` : "", p.floor ? `${p.floor}階` : ""]
        .map(t => t.toLowerCase());
      return tokens.every(t => texts.some(x => x.includes(t)));
    })
    .sort((a, b) =>
      buildingOrder(a.building) - buildingOrder(b.building) ||
      (a.floor ?? 0) - (b.floor ?? 0) ||
      (a.roomNumber ?? "").localeCompare(b.roomNumber ?? "", "ja", { numeric: true })
    );
  if (hits.length > 0) return hits;

  const m = mockPlace(q);
  return [{ key: `m-${q}`, title: formatRoom(m.roomNumber), ...m }];
}
