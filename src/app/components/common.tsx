// 各画面で共通に使う、WCAG 2.2 に沿った部品
import { useId, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useFocusOnMount } from "../hooks/useFocusOnMount";

/**
 * 戻るボタンと見出し(h1)だけの画面上部。
 * 画面を開いたら見出しにフォーカスを移し、どの画面に来たかを読み上げさせる(2.4.3)
 */
export function ScreenHeader({ title, subtitle, onBack, backLabel, divider = true }: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel: string;
  divider?: boolean;
}) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  return (
    <div className="bg-white pt-12 pb-3 px-4" style={divider ? { boxShadow: "0 1px 0 #E8EAED" } : undefined}>
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#F1F3F4" }}
          aria-label={backLabel}
        >
          <ArrowLeft size={20} color="#3C4043" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 ref={headingRef} tabIndex={-1} data-focus-fallback style={{ fontSize: 17, fontWeight: 700, color: "#202124" }}>
            {title}
          </h1>
          {subtitle && <p style={{ fontSize: 13, color: "#5F6368" }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * 見出し付きの入力欄。
 * - 文字で見える見出しを <label> で入力欄に結び付ける(1.3.1 / 3.3.2。プレースホルダーだけに頼らない)
 * - 枠線は背景との差を 3:1 以上にする(1.4.11)
 * - 入力を消す×は 24px 以上(2.5.8)
 */
export function TextField({ label, value, onChange, placeholder, icon, onEnter, required, describedBy, invalid }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  onEnter?: () => void;
  required?: boolean;
  describedBy?: string;
  invalid?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex-1 min-w-0">
      <label htmlFor={id} className="block" style={{ fontSize: 13, fontWeight: 700, color: "#3C4043", marginBottom: 4 }}>
        {label}
        {required && <span style={{ color: "#C5221F" }}>(必須)</span>}
      </label>
      <div
        className="field flex items-center gap-1.5 rounded-xl px-3"
        style={{ backgroundColor: "#FFFFFF", border: `1px solid ${invalid ? "#C5221F" : "#80868B"}`, minHeight: 44 }}
      >
        {icon && <span aria-hidden="true" className="flex">{icon}</span>}
        <input
          id={id}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (onEnter && e.key === "Enter" && !e.nativeEvent.isComposing) onEnter(); }}
          enterKeyHint={onEnter ? "search" : undefined}
          placeholder={placeholder}
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="flex-1 min-w-0 bg-transparent py-2.5"
          style={{ fontSize: 15, color: "#202124" }}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="w-7 h-7 -mr-1 rounded-full flex items-center justify-center flex-shrink-0"
            aria-label={`${label}の入力を消す`}
          >
            <X size={16} color="#5F6368" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 選択肢ボタンのまとまり。役割(group)と見出しを支援技術に伝える
 */
export function ChipGroup({ label, inline, children, describedBy }: {
  label: string;
  inline?: boolean;
  children: ReactNode;
  describedBy?: string;
}) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} aria-describedby={describedBy} className={inline ? "flex items-center gap-2" : ""}>
      <span
        id={id}
        className={inline ? "flex-shrink-0" : "block"}
        style={{ fontSize: 13, fontWeight: 700, color: "#3C4043", width: inline ? 32 : undefined, marginBottom: inline ? 0 : 6 }}
      >
        {label}
      </span>
      <div className="flex-1 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/**
 * 選択肢ボタン。選択中かどうかを aria-pressed で伝え、見た目も色に加えて文字の太さ・枠で区別する(1.4.1)
 */
export function Chip({ label, selected, onClick, grow, ariaLabel }: {
  label: string;
  selected: boolean;
  onClick: () => void;
  grow?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`rounded-lg whitespace-nowrap ${grow ? "flex-1 px-1" : "px-2.5"}`}
      style={{
        minHeight: 36,
        fontSize: 14, fontWeight: selected ? 700 : 600,
        backgroundColor: selected ? "#1967D2" : "#FFFFFF",
        color: selected ? "#FFFFFF" : "#3C4043",
        border: `1px solid ${selected ? "#1967D2" : "#80868B"}`,
      }}
    >
      {label}
    </button>
  );
}
