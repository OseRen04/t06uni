import { matchesDay, matchesPeriod } from "./schedule";

type Searchable = {
  texts: string[];
  day?: number;
  period?: number;
};

/** 全角・半角スペースで区切った語に分ける */
export const tokenize = (q: string) => q.trim().toLowerCase().split(/[\s　]+/).filter(Boolean);

/**
 * 区切った語がすべて、どれかの項目に当てはまれば一致とする。
 * 例:「月曜 1限 田中」→ 月曜・1限・教員名の3条件をすべて満たす講義だけが残る
 */
export function matchesQuery(tokens: string[], item: Searchable) {
  return tokens.every(token =>
    item.texts.some(t => t.toLowerCase().includes(token)) ||
    (item.day !== undefined && matchesDay(token, item.day)) ||
    (item.period !== undefined && matchesPeriod(token, item.period))
  );
}
