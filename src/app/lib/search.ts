/** 全角・半角スペースで区切った語に分ける(小文字にそろえる) */
export const tokenize = (q: string) => q.trim().toLowerCase().split(/[\s　]+/).filter(Boolean);

/**
 * 検索語に一致した部分を強調表示するため、text を「一致する部分」と「しない部分」に分ける。
 * 例: ("ミクロ経済学", ["経済"]) → [{ text: "ミクロ" }, { text: "経済", hit: true }, { text: "学" }]
 */
export function splitByTokens(text: string, tokens: string[]) {
  if (tokens.length === 0) return [{ text, hit: false }];
  const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return text
    .split(new RegExp(`(${escaped.join("|")})`, "gi"))
    .filter(Boolean)
    .map(part => ({ text: part, hit: tokens.includes(part.toLowerCase()) }));
}
