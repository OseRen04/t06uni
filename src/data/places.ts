// キャンパス自由検索(教室名・棟の名前)の検索対象
import { formatRoom } from "@/lib/schedule";
import { matchesQuery, tokenize } from "@/lib/search";
import { CAMPUS_BUILDINGS } from "./campus";
import { CATALOG } from "./catalog";

export type Place = {
  key: string;
  title: string;      // 例: 「104号室」「学部棟」
  building: string;
  floor?: number;
  roomNumber?: string;
};

function buildPlaces(): Place[] {
  const places: Place[] = CAMPUS_BUILDINGS.map(b => ({ key: `b-${b.id}`, title: b.id, building: b.id }));

  // 教室は授業一覧に出てくるものを使う(フロアマップのデータが入ったら、そちらの部屋も加える)
  const seen = new Set<string>();
  for (const c of CATALOG) {
    const k = `${c.building}-${c.floor}-${c.roomNumber}`;
    if (seen.has(k)) continue;
    seen.add(k);
    places.push({
      key: `r-${k}`,
      title: formatRoom(c.roomNumber),
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
