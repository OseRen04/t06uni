# キャンパス授業ナビ(仮)

時間割から授業を選ぶだけで、現在地から建物までの道順と、建物のフロアマップ上の教室の位置を続けて確認できるモバイルアプリのプロトタイプ。

対象ユーザーは、大学内で授業間を移動する学生(特に新入生や、初めて使う教室が多い学生)。詳しい背景・課題設定は [docs/t06中間報告.md](docs/t06中間報告.md) を参照。

## アプリのスクショ

| 時間割画面 | キャンパスマップ画面 | フロア案内画面 |
| --- | --- | --- |
| ![時間割画面](画面遷移図/home.png) | ![キャンパスマップ画面](画面遷移図/campusMap.png) | ![フロア案内画面](画面遷移図/floor_01.png) |
| 曜日・時限ごとに授業を表示し、講義・教室・棟を検索できる。 | 選んだ授業の建物までの道順と、現在地からの徒歩時間(例: 徒歩約3分)を表示する。 | 学部棟1Fのフロアマップ上で、目的の教室にピンを立てる。 |

全画面の遷移をまとめた図は [画面遷移図/画面遷移図.png](画面遷移図/画面遷移図.png)。スクショと遷移図は MVP 確定前の版で、フロア案内画面の写真と3ステップ案内は現在のアプリにはない。

## 仕様(MVPの必須機能)

MVP 最終決定の項目と、それを実装している場所。

### 時間割

| MVP 項目 | 内容 | 実装 |
| --- | --- | --- |
| 時間割の作成と編集 | 講義の追加、編集モードでの内容の変更(講義をタップ)と削除(×)。同じ曜日・時限への重複登録はできない | [Timetable.tsx](src/components/Timetable.tsx)、[CourseFormModal.tsx](src/components/CourseFormModal.tsx) |
| 授業登録検索(授業名、曜日、何コマ、教授の名前) | 講義の追加画面で授業一覧を検索し、「登録」ボタンでそのまま時間割に入れる。「月曜 2限」「田中」のように複数の条件を空白区切りで組み合わせられる。見つからない授業は手入力で追加できる | [CourseFormModal.tsx](src/components/CourseFormModal.tsx)、[catalog.ts](src/data/catalog.ts) |
| 時間割表に講義名, 講義室, 棟, 階層を表示 | 各セルに講義名・棟・階・教室番号を表示する | [Timetable.tsx](src/components/Timetable.tsx) |
| キャンパス自由検索(教室名, 棟の名前) | 時間割画面の検索欄で、登録済みの講義に加えてキャンパス内の教室・棟も検索し、その場所のキャンパスマップを開く | [Timetable.tsx](src/components/Timetable.tsx)、[places.ts](src/data/places.ts) |
| 曜日時間のフォーマット | 曜日・時限・時刻の表記を「木曜 1限 8:50–10:20」の形にそろえる。表記は1つのファイルの関数で作る | [schedule.ts](src/lib/schedule.ts) |

### キャンパスマップ

| MVP 項目 | 内容 | 実装 |
| --- | --- | --- |
| 現在地(GPS) | 端末の GPS で現在地を取り、地図上に表示する。位置情報が許可されていない・キャンパスの外にいる・取得できないときは、正門を仮の現在地にして理由を表示する | [useCampusLocation.ts](src/hooks/useCampusLocation.ts) |
| 大学マップ | 建物・道路・緑地を描いたキャンパスマップ。目的の建物を強調し、ピンを立てる | [CampusMap.tsx](src/components/CampusMap.tsx)、[campus.ts](src/data/campus.ts) |
| 方角 | 北を示す方位磁針に加え、現在地マーカーに端末が向いている方角を扇形で表示する(iPhone / Android のみ。ブラウザでは方角を取れない) | [CampusMap.tsx](src/components/CampusMap.tsx) |
| 案内経路 | 現在地から目的の建物の入口まで、道路に沿った最短経路を描き、徒歩時間を計算する | [campus.ts](src/data/campus.ts) の `findRoute` |

### フロアマップ

| MVP 項目 | 内容 | 実装 |
| --- | --- | --- |
| フロアマップ | 講義の棟・階のフロアマップを表示する。フロアマップがない階は「準備中」と表示する | [FloorMap.tsx](src/components/FloorMap.tsx)、[floorPlans.ts](src/data/floorPlans.ts) |
| 目的の教室のピン | 講義の教室番号(または検索した教室)をフロアマップ上で探し、赤枠とピンで示す | [FloorMap.tsx](src/components/FloorMap.tsx) |

### 現在の制約

| 制約 | 対応方法 |
| --- | --- |
| キャンパスマップは架空の配置で、GPS の緯度経度との対応が未設定(`CAMPUS_GEO = null`)。このため今は常に正門を起点に案内する | [campus.ts](src/data/campus.ts) の `CAMPUS_GEO` に、地図の北端・南端の緯度と西端・東端の経度を入れる |
| フロアマップがあるのは学部棟 1F だけ | [floorPlans.ts](src/data/floorPlans.ts) の `FLOOR_PLANS` に、棟・階ごとの部屋の配置を追加する |
| 授業一覧はサンプルデータ(19件) | [catalog.ts](src/data/catalog.ts) を実際のシラバスのデータに置き換える |
| 時間割の変更はアプリを開いている間だけ保持され、再起動すると初期状態に戻る | 端末への保存(永続化)は未実装 |
| 方角の表示と GPS の許可ダイアログの文言は、実機で確認していない | Expo Go で実機確認する |

発展機能の検討リストは [docs/t06中間報告.md](docs/t06中間報告.md) の「発展機能として検討するもの」を参照。

## ドキュメントの在処

| ドキュメント | 内容 |
| --- | --- |
| [docs/t06中間報告.md](docs/t06中間報告.md) | 対象ユーザー・課題設定・MVP機能・利用フローを含む中間報告書 |
| [docs/中間報告改良版.md](docs/中間報告改良版.md) | 中間報告の改良版 |
| [docs/システム構成.md](docs/システム構成.md) | 画面構成、入力・処理・出力、案内に使う情報の一覧 |
| [docs/利用フロー.md](docs/利用フロー.md) | 利用者が時間割から講義室入口に着くまでの操作フロー |
| [docs/スライド.md](docs/スライド.md) | 発表用スライドのMarkdownソース(Marp形式) |
| [docs/pdf/](docs/pdf/) | 上記ドキュメントをまとめたPDF(例: 利用フローとシステム構成.pdf) |
| [AGENTS.md](AGENTS.md) | Expo / React Native 開発時の注意点(Expo のテンプレートに付属) |
| [ATTRIBUTIONS.md](ATTRIBUTIONS.md) | 使用素材のクレジット |

## 起動方法

React Native(Expo)のアプリ。Node.js 20 以上が必要。

```bash
npm install     # 依存パッケージのインストール
npm start       # Expo の開発サーバーを起動(npx expo start)
```

開発サーバーが起動したら、次のどれかで開く。

| 開き方 | 操作 |
| --- | --- |
| 実機(iPhone / Android) | スマホに Expo Go アプリを入れ、ターミナルに出る QR コードを読み取る(PC と同じ Wi-Fi に接続しておく) |
| iOS シミュレータ | ターミナルで `i` を押す(Mac + Xcode が必要) |
| Android エミュレータ | ターミナルで `a` を押す(Android Studio が必要) |
| ブラウザ | ターミナルで `w` を押す。発表時の画面共有などに使える |

型チェックは `npm run typecheck`、依存関係の診断は `npx expo-doctor`。ライブラリを追加するときは `npm install` ではなく `npx expo install <パッケージ名>` を使う(Expo SDK に合うバージョンが選ばれる)。

### ファイル構成

| パス | 内容 |
| --- | --- |
| [src/app/](src/app/) | 画面(Expo Router のルート)。`index.tsx` が時間割、`campus.tsx` がキャンパスマップ、`floor.tsx` がフロアマップ |
| [src/components/](src/components/) | 各画面の本体(Timetable / CourseFormModal / CampusMap / FloorMap) |
| [src/state/CoursesContext.tsx](src/state/CoursesContext.tsx) | 授業データ(初期データ・追加・削除)を全画面で共有する Context |
| [src/data/](src/data/) | キャンパスの建物・道路と経路探索、フロアマップ、授業一覧、場所検索のデータ |
| [src/lib/](src/lib/) | 曜日・時限の表記、検索の条件判定、画面に渡す行き先の変換 |
| [src/hooks/useCampusLocation.ts](src/hooks/useCampusLocation.ts) | GPS の現在地と端末の向きを地図座標で返す |
| [src/types.ts](src/types.ts) | `Course` 型 |
| [assets/](assets/) | アプリアイコンと、報告書で使っている写真(アプリでは使っていない) |

## Skillについて

このリポジトリには `.claude/skills/` に、Claude Code がドキュメント作成時に自動的に使うSkillを2つ用意している。

| Skill | 用途 |
| --- | --- |
| [concrete-writing](.claude/skills/concrete-writing/SKILL.md) | 報告書やREADMEなどを書く際に「様々な」「適切に」のような抽象表現を検出し、数値・固有名詞を伴う具体的な表現に置き換える。 |
| [md-to-pdf](.claude/skills/md-to-pdf/SKILL.md) | Markdownドキュメントを headless Chrome でPDF化する。`scripts/md_to_pdf/run.sh` を使い、表紙・目次付きのA4 PDFを `docs/pdf/` に生成する。 |

## 使用技術

| 分類 | 技術 |
| --- | --- |
| フレームワーク | React Native 0.88 + Expo SDK 58(React 19.3) |
| 言語 | TypeScript 6 |
| 画面遷移 | Expo Router(ファイルベースのルーティング、ネイティブのスタック遷移) |
| スタイリング | React Native の `StyleSheet` |
| 地図の描画 | react-native-svg(キャンパスマップ)、View の絶対配置(フロアマップ) |
| 位置情報 | expo-location(GPS の現在地と端末の向き) |
| アニメーション | React Native 標準の `Animated` |
| アイコン | lucide-react-native |
| Web 表示 | react-native-web(ブラウザでも同じ画面を表示できる) |
| PDF生成 | Node.js + marked + headless Chrome(`scripts/md_to_pdf/`) |

このプロジェクトは Figma Make で生成した Web 版(React + Vite + Tailwind CSS)を起点にし、React Native に移植した。Web 版のコードは git の履歴(`main` ブランチのコミット e10aba30 まで)に残っている。元デザインは [Figma](https://www.figma.com/design/cpKA0CQzFXUiVBOxrLYnWk/%E3%83%A2%E3%83%90%E3%82%A4%E3%83%AB%E3%83%9E%E3%83%83%E3%83%97%E3%83%97%E3%83%AD%E3%83%88%E3%82%BF%E3%82%A4%E3%83%97) を参照。
