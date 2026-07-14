#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const [, , inputDir, outputHtmlPath, title] = process.argv;

if (!inputDir || !outputHtmlPath || !title) {
  console.error("使い方: build_html.mjs <input_dir> <output_html> <title>");
  process.exit(1);
}

marked.setOptions({ gfm: true, breaks: false });

const collator = new Intl.Collator("ja-JP", { numeric: true, sensitivity: "base" });

function collectMarkdownFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "pdf") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

if (!fs.existsSync(inputDir)) {
  console.error(`入力フォルダが見つかりません: ${inputDir}`);
  process.exit(1);
}

const files = collectMarkdownFiles(inputDir).sort((a, b) => collator.compare(a, b));

if (files.length === 0) {
  console.error(`Markdownファイルが見つかりません: ${inputDir}`);
  process.exit(1);
}

function extractHeading(content, filePath) {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return path.basename(filePath, ".md");
}

const docs = files.map((filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const heading = extractHeading(content, filePath);
  return {
    filePath,
    heading,
    html: marked.parse(content),
  };
});

const tocItems = docs
  .map((doc, i) => `<li><a href="#doc-${i}">${escapeHtml(doc.heading)}</a></li>`)
  .join("\n");

const sections = docs
  .map(
    (doc, i) => `
<section id="doc-${i}" class="doc">
${doc.html}
</section>`
  )
  .join("\n");

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const today = new Date().toLocaleDateString("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page {
    size: A4;
    margin: 18mm 16mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
    color: #1a1a1a;
    line-height: 1.7;
    font-size: 11pt;
  }
  .cover {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    page-break-after: always;
  }
  .cover h1 {
    font-size: 26pt;
    margin-bottom: 1em;
  }
  .cover .date {
    font-size: 12pt;
    color: #555;
  }
  .toc {
    page-break-after: always;
  }
  .toc h2 {
    font-size: 16pt;
    border-bottom: 2px solid #333;
    padding-bottom: 0.3em;
  }
  .toc ol {
    counter-reset: toc-counter;
    list-style: none;
    padding-left: 0;
  }
  .toc li {
    margin: 0.6em 0;
    font-size: 11pt;
  }
  .toc a {
    color: #1a1a1a;
    text-decoration: none;
  }
  .doc {
    page-break-before: always;
  }
  .doc:first-of-type {
    page-break-before: auto;
  }
  h1 { font-size: 18pt; border-bottom: 2px solid #333; padding-bottom: 0.2em; }
  h2 { font-size: 15pt; border-bottom: 1px solid #999; padding-bottom: 0.2em; margin-top: 1.6em; }
  h3 { font-size: 13pt; margin-top: 1.4em; }
  h4 { font-size: 12pt; margin-top: 1.2em; }
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 10pt;
    margin: 1em 0;
  }
  th, td {
    border: 1px solid #ccc;
    padding: 0.4em 0.6em;
    text-align: left;
  }
  th {
    background: #f0f0f0;
  }
  pre {
    background: #f5f5f5;
    padding: 0.8em;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 9.5pt;
  }
  code {
    font-family: "SF Mono", Menlo, monospace;
    font-size: 0.95em;
  }
  img {
    max-width: 100%;
  }
  blockquote {
    border-left: 4px solid #ccc;
    margin: 1em 0;
    padding: 0.2em 1em;
    color: #555;
  }
</style>
</head>
<body>
  <div class="cover">
    <h1>${escapeHtml(title)}</h1>
    <div class="date">${today}</div>
  </div>
  <div class="toc">
    <h2>目次</h2>
    <ol>
${tocItems}
    </ol>
  </div>
  ${sections}
</body>
</html>
`;

fs.writeFileSync(outputHtmlPath, html, "utf-8");
console.log(`HTML生成完了: ${outputHtmlPath} (${docs.length}件のドキュメント)`);
