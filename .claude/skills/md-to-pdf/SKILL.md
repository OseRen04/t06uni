---
name: md-to-pdf
description: Markdownファイル(または複数のMarkdownをまとめたフォルダ)をPDFに変換する際に使用する。日本語フォントの表示崩れなしに、表紙・目次付きのA4 PDFを headless Chrome で生成する。トリガー:「PDFに変換して」「PDF化して」「◯◯.mdをPDFにして」「報告書をPDF出力して」など。
---

# MarkdownをPDFに変換する (md-to-pdf)

このリポジトリには既に変換用スクリプトが `scripts/md_to_pdf/` にある。**まずこれを使う**。自分で新しいpandoc/wkhtmltopdfなどの導入を提案しない(未インストールで、Chromeベースの既存パイプラインで十分)。

## 前提の確認

- `scripts/md_to_pdf/run.sh` と `scripts/md_to_pdf/build_html.mjs` が存在するか確認する。存在しなければ「既存スクリプトなし」節の手順にフォールバックする。
- 変換には `node` と `/Applications/Google Chrome.app` が必要(このマシンには両方入っている)。

## 手順(既存スクリプトを使う場合)

`run.sh` は `<入力フォルダ> <出力PDFパス> <タイトル>` の3つ組を1セットとして受け取り、フォルダ内の全 `.md` ファイルを収集して1つのPDF(表紙+目次+各章)にまとめる。単一ファイルではなく**フォルダ単位**で動く点に注意。

1. 変換したいMarkdownがどのフォルダにあるか確認する。
   - フォルダ内の `.md` を全部まとめたい → そのままフォルダを指定。
   - フォルダ内の特定の1〜数ファイルだけをPDF化したい → 対象ファイルだけを含む一時フォルダを作り、そこにコピー(シンボリックリンクでも可)してから指定する。画像を相対パスで参照しているファイルがある場合は、画像も同じ相対位置にコピーすること。
2. 出力先はこのリポジトリの慣習に合わせて `<元フォルダ>/pdf/<タイトル>.pdf` にする(例: `docs/pdf/利用フローとシステム構成.pdf` が既存例)。
3. 実行する:
   ```bash
   bash scripts/md_to_pdf/run.sh "<入力フォルダ>" "<出力PDFパス>" "<タイトル>"
   ```
   複数組を空白区切りで連続指定すれば一度に複数PDFを生成できる。
4. 初回は `npm install`(marked パッケージ)が自動実行される。
5. 生成が終わると Finder でPDFの場所が自動的に開かれる(`open -R`)。CI的な用途で不要ならその点を伝える。
6. 生成後、PDFのページ数やファイルサイズを `ls -la` 等で確認し、0バイトや異常に小さいファイルになっていないか確認する。

## 既存スクリプトなしの場合(フォールバック)

1. 変換対象のMarkdownを `marked`(npm、`npx --yes marked` でその場実行可)でHTMLに変換する。日本語のCJKフォント崩れを避けるため、生成するHTMLに以下を必ず含める:
   ```html
   <meta charset="utf-8" />
   <style>
     body { font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; }
     @page { size: A4; margin: 18mm 16mm; }
     table { border-collapse: collapse; width: 100%; }
     th, td { border: 1px solid #ccc; padding: 0.4em 0.6em; }
     img { max-width: 100%; }
   </style>
   ```
2. 画像を相対パスで参照している場合は、生成するHTMLファイルを**元のMarkdownと同じディレクトリ**に置く(`/tmp`など別ディレクトリに置くと相対パスの画像が解決できずリンク切れになる)。
3. headless Chromeで直接PDF化する(pandocやwkhtmltopdfはこのマシンに未インストールのため使わない):
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless=new --disable-gpu --no-pdf-header-footer \
     --print-to-pdf="<出力先>.pdf" --print-to-pdf-no-header \
     "file://<絶対パス>/<一時HTML>.html"
   ```
4. 変換が終わったら一時HTMLファイルを削除する。

## 注意点

- 出力ファイル名・格納場所は既存の `docs/pdf/` のような慣習があればそれに合わせる。新しい慣習を勝手に作らない。
- タイトルや表紙に入れる日付など、内容に関わる文言は [[concrete-writing]] のルール(抽象表現を避ける)にも従う。
- PDF化は成果物を生成する操作であり、リポジトリへのコミットは別途ユーザーの指示があるまで行わない。
