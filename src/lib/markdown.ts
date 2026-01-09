import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { codeToHtml } from "shiki";

export async function renderMarkdown(content: string): Promise<string> {
  // First pass: convert markdown to HTML (without code highlighting)
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(content);

  let html = String(file);

  // Second pass: highlight code blocks with Shiki
  // Match both with and without language class
  const codeBlockRegex =
    /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g;

  const matches = [...html.matchAll(codeBlockRegex)];
  for (const match of matches) {
    const [fullMatch, lang, code] = match;
    const decoded = decodeHtmlEntities(code);
    const highlighted = await codeToHtml(decoded, {
      lang: lang || "text",
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    });
    html = html.replace(fullMatch, highlighted);
  }

  return html;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
