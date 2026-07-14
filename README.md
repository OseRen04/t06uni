# キャンパス授業ナビ(仮)

時間割から授業を選ぶだけで、建物までの道順と、建物内で講義室入口へ向かう案内を続けて確認できるモバイルアプリのプロトタイプ。

対象ユーザーは、大学内で授業間を移動する学生(特に新入生や、初めて使う教室が多い学生)。詳しい背景・課題設定は [docs/t06中間報告.md](docs/t06中間報告.md) を参照。

## アプリのスクショ

| 時間割画面 | キャンパスマップ画面 | フロア案内画面 |
| --- | --- | --- |
| ![時間割画面](画面遷移図/home.png) | ![キャンパスマップ画面](画面遷移図/campusMap.png) | ![フロア案内画面](画面遷移図/floor_01.png) |
| 曜日・時限ごとに授業を表示し、講義名・教室・棟で検索できる。 | 選んだ授業の建物までの道順と、現在地からの徒歩時間(例: 徒歩約3分)を表示する。 | 学部棟1Fの正面玄関から104講義室入口まで、3ステップで写真付き案内をする。 |

全画面の遷移をまとめた図は [画面遷移図/画面遷移図.png](画面遷移図/画面遷移図.png)。

## 仕様(MVPの必須機能)

| 機能 | 内容 | 実装コンポーネント |
| --- | --- | --- |
| 時間割表示 | 曜日・時限ごとに授業カードを表示する。 | [src/app/components/Timetable.tsx](src/app/components/Timetable.tsx) |
| 授業検索 | 授業名、教室番号、建物名、担当教員から授業を探す。 | [src/app/components/Timetable.tsx](src/app/components/Timetable.tsx) |
| 授業追加 | 授業名、曜日、時限、建物、階、教室番号を入力して追加する。同じ曜日・時限の重複は追加できない。 | [src/app/components/AddCourseModal.tsx](src/app/components/AddCourseModal.tsx) |
| 建物までの案内 | 現在地から目的の建物までの道順と徒歩時間を表示する。 | [src/app/components/CampusMap.tsx](src/app/components/CampusMap.tsx) |
| 建物内の案内 | フロア図・現在位置・写真・説明文を使い、3ステップ(正面玄関→エレベーター前→104講義室入口)で講義室入口まで案内する。 | [src/app/components/FloorMap.tsx](src/app/components/FloorMap.tsx) |

現在のプロトタイプは学部棟1F・104講義室のみを対象とする。授業の追加・削除はアプリを開いている間だけ保持され、再読み込みで初期状態に戻る(永続化は未実装)。発展機能の検討リストは [docs/t06中間報告.md](docs/t06中間報告.md) の「発展機能として検討するもの」を参照。

## ドキュメントの在処

| ドキュメント | 内容 |
| --- | --- |
| [docs/t06中間報告.md](docs/t06中間報告.md) | 対象ユーザー・課題設定・MVP機能・利用フローを含む中間報告書 |
| [docs/中間報告改良版.md](docs/中間報告改良版.md) | 中間報告の改良版 |
| [docs/システム構成.md](docs/システム構成.md) | 画面構成、入力・処理・出力、案内に使う情報の一覧 |
| [docs/利用フロー.md](docs/利用フロー.md) | 利用者が時間割から講義室入口に着くまでの操作フロー |
| [docs/スライド.md](docs/スライド.md) | 発表用スライドのMarkdownソース(Marp形式) |
| [docs/pdf/](docs/pdf/) | 上記ドキュメントをまとめたPDF(例: 利用フローとシステム構成.pdf) |
| [guidelines/Guidelines.md](guidelines/Guidelines.md) | UI実装のガイドライン |
| [ATTRIBUTIONS.md](ATTRIBUTIONS.md) | 使用素材のクレジット |

## 起動方法

```bash
npm i        # 依存パッケージのインストール
npm run dev  # 開発サーバーを起動(Vite)
```

本番ビルドは `npm run build`(Viteで `dist/` に出力)。

## Skillについて

このリポジトリには `.claude/skills/` に、Claude Code がドキュメント作成時に自動的に使うSkillを2つ用意している。

| Skill | 用途 |
| --- | --- |
| [concrete-writing](.claude/skills/concrete-writing/SKILL.md) | 報告書やREADMEなどを書く際に「様々な」「適切に」のような抽象表現を検出し、数値・固有名詞を伴う具体的な表現に置き換える。 |
| [md-to-pdf](.claude/skills/md-to-pdf/SKILL.md) | Markdownドキュメントを headless Chrome でPDF化する。`scripts/md_to_pdf/run.sh` を使い、表紙・目次付きのA4 PDFを `docs/pdf/` に生成する。 |

## 使用技術

| 分類 | 技術 |
| --- | --- |
| フレームワーク | React 18, Vite 6 |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS 4, `@tailwindcss/vite` |
| UIコンポーネント | Radix UI, MUI (`@mui/material`), shadcn系コンポーネント一式(`src/app/components/ui/`) |
| フォーム | react-hook-form |
| ルーティング | react-router |
| その他 | lucide-react(アイコン)、sonner(トースト通知)、recharts(グラフ)、date-fns |
| PDF生成 | Node.js + marked + headless Chrome(`scripts/md_to_pdf/`) |

このプロジェクトは Figma Make で生成したコードバンドルを起点にしている。元デザインは [Figma](https://www.figma.com/design/cpKA0CQzFXUiVBOxrLYnWk/%E3%83%A2%E3%83%90%E3%82%A4%E3%83%AB%E3%83%9E%E3%83%83%E3%83%97%E3%83%97%E3%83%AD%E3%83%88%E3%82%BF%E3%82%A4%E3%83%97) を参照。
