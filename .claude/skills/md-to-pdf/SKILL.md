---
name: md-to-pdf
description: 設計書（Markdown）フォルダをまとめてPDFに変換する。「設計書をPDFに」「client/docs/設計書をPDF化」「API設計書をPDFに」などの場合に使用する
user-invocable: true
---

# Markdown → PDF 変換スキル

指定フォルダ配下の `.md` を再帰的に集めて、フォルダ単位で 1 つの PDF にまとめる。
表紙・目次付き／A4／日本語フォント対応。変換後は生成した PDF を Finder で表示する。

## 使い方

### デフォルト(このPJの3つのドキュメントフォルダを一括変換)

```
/md-to-pdf
```

引数なしで実行すると、以下の3つを変換する:

| 入力 | 出力 |
|---|---|
| `client/docs/設計書/` | `client/docs/設計書/pdf/client設計書.pdf` |
| `server/docs/api/` | `server/docs/api/pdf/serverAPI設計書.pdf` |
| `docs/設定資料集/` | `docs/設定資料集/pdf/設定資料集.pdf` |

### 任意のフォルダを変換

3つ1組で複数指定できる:

```bash
scripts/md_to_pdf/run.sh \
  <input_dir> <output_pdf> <title> \
  [<input_dir> <output_pdf> <title> ...]
```

例:

```bash
scripts/md_to_pdf/run.sh \
  docs_design-seat docs_design-seat/pdf/design-seat.pdf "自分エージェント3.0 研究デザインシート"
```

## 手順

1. `bash scripts/md_to_pdf/run.sh [<args>]` を実行する
2. 初回のみ `npm install`(marked のみ)が自動で走る
3. 各フォルダごとに combined HTML を一時ファイルに生成 → Chrome ヘッドレスで PDF 化
4. 生成された PDF が Finder で開く(`open -R`)

## 仕様

- **ソート**: ファイル名の自然順(`01_オンボーディング` → `02_チャット` → …、日本語混在も OK)
- **再帰**: サブフォルダ配下の `.md` もすべて取り込む(出力先の `pdf/` フォルダは除外)
- **構成**: 表紙ページ → 目次 → 各ドキュメント(改ページ区切り)。各ドキュメントの見出しはファイル内の最初の `# `、なければファイル名を使う
- **スタイル**: A4／余白 18×16mm／Hiragino Sans／GFMテーブル対応
- **依存**: `node`, `npm`, `/Applications/Google Chrome.app`

## ファイル構成

```
scripts/md_to_pdf/
├── run.sh           # エントリポイント(このスキルから呼ぶ)
├── build_html.mjs   # md → combined HTML 変換(marked 使用)
├── package.json      # marked の依存定義
└── .gitignore        # node_modules を除外
```

## トラブルシューティング

- **`Google Chrome が見つかりません`**: macOS に Chrome をインストールしてから再実行
- **`node が PATH にありません`**: volta または nvm で node を有効化
- **PDF の文字が豆腐になる**: macOS 標準の Hiragino Sans が見つからない環境では `build_html.mjs` の `font-family` を調整
- **再生成したい**: 出力先 `pdf/*.pdf` は毎回上書きされる。差分管理したくないなら `.gitignore` に `**/pdf/` を追加
