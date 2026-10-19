// キャンパス自由検索(教室名・棟の名前)の検索対象
import { matchesQuery, tokenize } from "@/lib/search";
import { CAMPUS_BUILDINGS } from "./campus";
import { CATALOG } from "./catalog";
import { FLOOR_PLANS } from "./floorPlans";

export type Place = {
  key: string;
  title: string;      // 例: 「104 11講義室」「学部棟」
  building: string;
  floor?: number;
  roomNumber?: string;
  roomId?: string;
  area?: string;
};

function buildPlaces(): Place[] {
  const places: Place[] = CAMPUS_BUILDINGS.map(b => ({ key: `b-${b.id}`, title: b.id, building: b.id }));
  const seen = new Set<string>();

  // フロアマップにある部屋
  for (const plan of FLOOR_PLANS) {
    for (const r of plan.rooms) {
      places.push({
        key: `r-${plan.building}-${plan.floor}-${r.id}`,
        title: r.name ? `${r.number} ${r.name}` : `${r.number}号室`,
        building: plan.building, floor: plan.floor, roomNumber: r.number, roomId: r.id, area: r.area,
      });
      seen.add(`${plan.building}-${plan.floor}-${r.number}`);
    }
  }

  // フロアマップはまだないが、授業一覧に出てくる教室
  for (const c of CATALOG) {
    const k = `${c.building}-${c.floor}-${c.roomNumber}`;
    if (seen.has(k)) continue;
    seen.add(k);
    places.push({
      key: `c-${k}`,
      title: /^[\dA-Z]+$/i.test(c.roomNumber) ? `${c.roomNumber}号室` : c.roomNumber,
      building: c.building, floor: c.floor, roomNumber: c.roomNumber,
    });
  }
  return places;
}

export const PLACES = buildPlaces();

export function searchPlaces(q: string, limit = 20) {
  const tokens = tokenize(q);
  if (tokens.length === 0) return [];
  return PLACES.filter(p =>
    matchesQuery(tokens, {
      texts: [p.title, p.building, p.floor ? `${p.floor}F` : "", p.floor ? `${p.floor}階` : ""],
    })
  ).slice(0, limit);
}
