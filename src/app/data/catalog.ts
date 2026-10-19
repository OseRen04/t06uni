import type { NewCourse } from "../types";
import { buildDummyCatalog } from "./mockCourses";

// 授業登録検索で使う授業一覧(開講科目)。
// 現在はモック環境用のダミーデータ。実際のシラバスのデータが手に入ったらここを置き換える
const SAMPLE: NewCourse[] = [
  { name: "マーケティング・マネジメント", professor: "田中 教授",   day: 0, period: 1, building: "学部棟",  floor: 2, roomNumber: "203" },
  { name: "経営学概論",                   professor: "佐藤 教授",   day: 0, period: 2, building: "学部棟",  floor: 3, roomNumber: "302" },
  { name: "情報科学基礎",                 professor: "森 准教授",   day: 0, period: 3, building: "学部棟",  floor: 1, roomNumber: "101" },
  { name: "英語コミュニケーションⅠ",     professor: "Brown 講師", day: 0, period: 4, building: "講義棟",  floor: 1, roomNumber: "K11" },
  { name: "情報処理入門",                 professor: "山田 准教授", day: 1, period: 1, building: "研究棟A", floor: 1, roomNumber: "105" },
  { name: "線形代数",                     professor: "石井 教授",   day: 1, period: 2, building: "学部棟",  floor: 1, roomNumber: "107" },
  { name: "統計学",                       professor: "鈴木 教授",   day: 1, period: 3, building: "学部棟",  floor: 2, roomNumber: "201" },
  { name: "体育実技",                     professor: "岡田 講師",   day: 1, period: 4, building: "体育館",  floor: 1, roomNumber: "アリーナ" },
  { name: "ミクロ経済学",                 professor: "田中 教授",   day: 2, period: 1, building: "学部棟",  floor: 1, roomNumber: "109" },
  { name: "組織行動論",                   professor: "高橋 教授",   day: 2, period: 2, building: "学部棟",  floor: 3, roomNumber: "304" },
  { name: "会計学基礎",                   professor: "伊藤 教授",   day: 2, period: 4, building: "図書館",  floor: 1, roomNumber: "L101" },
  { name: "ビジネス英語",                 professor: "Smith 講師", day: 3, period: 1, building: "学部棟",  floor: 1, roomNumber: "104" },
  { name: "微分積分",                     professor: "石井 教授",   day: 3, period: 2, building: "学部棟",  floor: 1, roomNumber: "101" },
  { name: "国際経済論",                   professor: "中村 教授",   day: 3, period: 3, building: "研究棟B", floor: 2, roomNumber: "205" },
  { name: "プログラミング演習",           professor: "山田 准教授", day: 3, period: 4, building: "研究棟A", floor: 2, roomNumber: "210" },
  { name: "データ分析",                   professor: "渡辺 准教授", day: 4, period: 2, building: "研究棟A", floor: 1, roomNumber: "103" },
  { name: "キャリアデザイン",             professor: "小林 教授",   day: 4, period: 3, building: "講義棟",  floor: 1, roomNumber: "K12" },
  { name: "経営戦略論",                   professor: "小林 教授",   day: 4, period: 4, building: "学部棟",  floor: 3, roomNumber: "301" },
  { name: "日本文化論",                   professor: "佐藤 教授",   day: 4, period: 5, building: "学部棟",  floor: 1, roomNumber: "112" },
];

// 手で書いたサンプルに、各曜日・各コマを埋めるダミーを足す(同じ枠に同じ授業名があれば手書きを優先)
const sampleKeys = new Set(SAMPLE.map(c => `${c.day}-${c.period}-${c.name}`));
export const CATALOG: NewCourse[] = [
  ...SAMPLE,
  ...buildDummyCatalog().filter(c => !sampleKeys.has(`${c.day}-${c.period}-${c.name}`)),
];
