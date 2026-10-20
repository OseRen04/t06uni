import { useEffect, useRef } from "react";

/**
 * 画面を開いたときに、その画面の見出しへフォーカスを移す(WCAG 2.4.3 フォーカス順序)。
 * スクリーンリーダーでは画面が切り替わったことと、どの画面かが読み上げられる。
 * 見出しには tabIndex={-1} を付けて使う
 */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
}
