import { splitByTokens } from "../lib/search";

/** 検索語に一致した部分を黄色で強調する */
export function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  return (
    <>
      {splitByTokens(text, tokens).map((part, i) =>
        part.hit
          ? <mark key={i} style={{ backgroundColor: "#FEEFC3", color: "inherit", borderRadius: 2 }}>{part.text}</mark>
          : <span key={i}>{part.text}</span>
      )}
    </>
  );
}
