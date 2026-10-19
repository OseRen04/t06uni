// モック環境用のダミー授業データ。
// ① 授業一覧を埋めるダミー(平日 5 日 × 5 コマの各枠に 3 件)
// ② 検索条件から機械的に作る模擬の検索結果
// 実際のシラバスのデータが入ったら、このファイルごと使わなくなる想定
import type { NewCourse } from "../types";
import { CLASSROOM_BUILDINGS } from "./campus";

const SUBJECTS = [
  "経済学入門", "経営組織論", "マクロ経済学", "財務会計論", "管理会計論", "商法", "民法総論", "憲法",
  "社会学概論", "心理学入門", "哲学", "日本史概説", "西洋史概説", "文学講読", "言語学入門",
  "英語リーディング", "英語ライティング", "中国語Ⅰ", "ドイツ語Ⅰ", "フランス語Ⅰ",
  "線形代数演習", "確率統計", "情報リテラシー", "データサイエンス基礎", "アルゴリズム論",
  "Webプログラミング", "人工知能概論", "環境科学", "生命科学", "物理学基礎",
  "マーケティング論", "消費者行動論", "国際関係論", "地域社会論", "ゼミナールⅠ",
];

const PROFESSORS = [
  "青木 教授", "井上 准教授", "上田 講師", "江藤 教授", "大野 准教授", "加藤 教授", "木村 講師",
  "工藤 准教授", "小西 教授", "斎藤 講師", "清水 教授", "杉山 准教授", "千葉 講師", "Johnson 講師",
  "竹内 教授", "土屋 准教授", "中島 教授", "西田 講師", "野口 准教授", "林 教授",
];

const SUFFIXES = ["入門", "演習", "特論", "概論", "応用"];

// 同じ入力なら毎回同じ結果になるよう、文字列から乱数の種を作る
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(items: T[], r: () => number) => items[Math.floor(r() * items.length)];

function place(r: () => number) {
  const building = pick(CLASSROOM_BUILDINGS, r);
  const floor = 1 + Math.floor(r() * 4);
  const roomNumber = `${floor}${String(1 + Math.floor(r() * 12)).padStart(2, "0")}`;
  return { building, floor, roomNumber };
}

/** 授業一覧を埋めるダミー。各曜日・各コマに 3 件ずつ */
export function buildDummyCatalog(): NewCourse[] {
  const list: NewCourse[] = [];
  for (let day = 0; day < 5; day++) {
    for (let period = 1; period <= 5; period++) {
      const r = rng(hash(`slot-${day}-${period}`));
      const used = new Set<string>();
      while (used.size < 3) {
        const name = pick(SUBJECTS, r);
        if (used.has(name)) continue;
        used.add(name);
        list.push({ name, professor: pick(PROFESSORS, r), day, period, ...place(r) });
      }
    }
  }
  return list;
}

export type SearchCriteria = {
  name: string;
  professor: string;
  day: number | null;
  period: number | null;
};

/**
 * 検索条件から模擬の授業を count 件作る。
 * 授業名・教員名に入力があればそれを使い、曜日・何コマの指定があればその枠にする。
 * 指定がないときは isFree(day, period) が true の空いている枠を優先する
 */
export function generateMockCourses(c: SearchCriteria, count: number, isFree: (day: number, period: number) => boolean): NewCourse[] {
  const r = rng(hash(JSON.stringify(c)));
  const slots: [number, number][] = [];
  for (let d = 0; d < 5; d++) for (let p = 1; p <= 5; p++) {
    if ((c.day === null || c.day === d) && (c.period === null || c.period === p)) slots.push([d, p]);
  }
  const free = slots.filter(([d, p]) => isFree(d, p));
  // 結果どうしが同じ枠で重ならないよう、枠を並べ替えてから順に割り当てる(枠が足りなければ一巡して使い回す)
  const candidates = (free.length > 0 ? free : slots)
    .map(s => ({ s, k: r() }))
    .sort((a, b) => a.k - b.k)
    .map(x => x.s);

  const name = c.name.trim();
  const professor = c.professor.trim();
  const result: NewCourse[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; result.length < count && i < count * 10; i++) {
    const courseName = name
      ? `${name}${SUFFIXES[(hash(name) + result.length) % SUFFIXES.length]}`
      : pick(SUBJECTS, r);
    if (usedNames.has(courseName)) continue;
    usedNames.add(courseName);
    const [day, period] = candidates[result.length % candidates.length];
    result.push({
      name: courseName,
      // 「田中」のように名前だけ入力されたときは「田中 教授」にする
      professor: professor ? (/(教授|准教授|講師)$/.test(professor) ? professor : `${professor} 教授`) : pick(PROFESSORS, r),
      day, period,
      ...place(r),
    });
  }
  return result;
}
