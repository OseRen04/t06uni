import { useEffect, useId, useRef } from "react";
import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * 取り消せない操作の前に出す確認ダイアログ(WCAG 3.3.4 誤操作の防止)。
 * - role="alertdialog" と aria-modal で、ダイアログであることを支援技術に伝える
 * - 開いたら安全な「キャンセル」にフォーカスを置き、Tab はダイアログの中だけを巡回させる
 * - Esc か背景のタップで閉じ、閉じたら開く前の位置へフォーカスを戻す
 */
export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onCancel }: Props) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => {
      // 開いたボタンが消えている(削除した)ときは、画面の見出しへ戻す
      const target = opener?.isConnected ? opener : document.querySelector<HTMLElement>("[data-focus-fallback]");
      target?.focus({ preventScroll: true });
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); onCancel(); return; }
    if (e.key !== "Tab") return;
    const items = dialogRef.current?.querySelectorAll<HTMLElement>("button");
    if (!items || items.length === 0) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-6" onKeyDown={onKeyDown}>
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel}
        aria-hidden="true"
      />
      <motion.div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full bg-white rounded-2xl p-5"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FCE8E6" }} aria-hidden="true">
            <AlertTriangle size={20} color="#C5221F" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id={titleId} style={{ fontSize: 17, fontWeight: 700, color: "#202124" }}>{title}</h2>
            <p id={descId} style={{ fontSize: 14, color: "#3C4043", marginTop: 6, lineHeight: 1.6 }}>{description}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl"
            style={{ fontSize: 15, fontWeight: 700, color: "#202124", backgroundColor: "#FFFFFF", border: "1px solid #80868B" }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl"
            style={{ fontSize: 15, fontWeight: 700, color: "white", backgroundColor: "#C5221F" }}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
