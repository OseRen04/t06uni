#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if ! command -v node >/dev/null 2>&1; then
  echo "エラー: node が PATH にありません" >&2
  exit 1
fi

if [ ! -x "${CHROME}" ]; then
  echo "エラー: Google Chrome が見つかりません (${CHROME})" >&2
  exit 1
fi

if [ ! -d "${SCRIPT_DIR}/node_modules" ]; then
  echo "初回セットアップ: npm install を実行します..."
  (cd "${SCRIPT_DIR}" && npm install --no-audit --no-fund)
fi

if [ "$#" -eq 0 ]; then
  set -- \
    "${REPO_ROOT}/client/docs/設計書" "${REPO_ROOT}/client/docs/設計書/pdf/client設計書.pdf" "client 設計書" \
    "${REPO_ROOT}/server/docs/api" "${REPO_ROOT}/server/docs/api/pdf/serverAPI設計書.pdf" "server API設計書" \
    "${REPO_ROOT}/docs/設定資料集" "${REPO_ROOT}/docs/設定資料集/pdf/設定資料集.pdf" "設定資料集"
fi

if [ $(( $# % 3 )) -ne 0 ]; then
  echo "エラー: 引数は <input_dir> <output_pdf> <title> の3つ1組で指定してください" >&2
  exit 1
fi

GENERATED_PDFS=()

while [ "$#" -gt 0 ]; do
  INPUT_DIR="$1"
  OUTPUT_PDF="$2"
  TITLE="$3"
  shift 3

  if [ ! -d "${INPUT_DIR}" ]; then
    echo "スキップ: 入力フォルダが存在しません (${INPUT_DIR})"
    continue
  fi

  echo "変換中: ${INPUT_DIR} → ${OUTPUT_PDF}"

  mkdir -p "$(dirname "${OUTPUT_PDF}")"
  TMP_HTML="$(mktemp -t md_to_pdf_XXXXXX).html"

  node "${SCRIPT_DIR}/build_html.mjs" "${INPUT_DIR}" "${TMP_HTML}" "${TITLE}"

  "${CHROME}" \
    --headless=new \
    --disable-gpu \
    --no-pdf-header-footer \
    --print-to-pdf="${OUTPUT_PDF}" \
    --print-to-pdf-no-header \
    "file://${TMP_HTML}" >/dev/null 2>&1

  rm -f "${TMP_HTML}"

  if [ -f "${OUTPUT_PDF}" ]; then
    echo "完了: ${OUTPUT_PDF}"
    GENERATED_PDFS+=("${OUTPUT_PDF}")
  else
    echo "エラー: PDF生成に失敗しました (${OUTPUT_PDF})" >&2
  fi
done

if [ "${#GENERATED_PDFS[@]}" -eq 0 ]; then
  echo "エラー: 生成されたPDFがありません" >&2
  exit 1
fi

for pdf in "${GENERATED_PDFS[@]}"; do
  open -R "${pdf}"
done
