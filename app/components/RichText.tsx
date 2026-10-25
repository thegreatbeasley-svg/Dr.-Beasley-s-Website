import React from "react";
import Link from "next/link";
import { normalizeLineEndings } from "@/lib/validation";

/**
 * Renders admin-authored plain text with a small, conservative Markdown
 * subset: paragraphs (blank-line separated), single line breaks, #/##/###
 * headings, **bold**, *italic*, "- " / "* " bullet lists, "1. " numbered
 * lists and [text](url) links.
 *
 * Output is built only from React elements and text nodes — never raw HTML —
 * so markup in the source (e.g. "<script>") is displayed as literal text.
 * Link targets are restricted to http(s), mailto and same-site paths.
 *
 * Handles LF, CRLF and CR sources, so records saved before line endings were
 * normalized on save still render with their original paragraphs.
 */

type Variant = "article" | "compact";

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; tag: "ul" | "ol"; items: string[] };

const HEADING = /^ {0,3}(#{1,3})[ \t]+(.+?)[ \t]*#*[ \t]*$/;
const BULLET = /^[ \t]*[-*•][ \t]+(.+)$/;
const NUMBERED = /^[ \t]*\d{1,3}[.)][ \t]+(.+)$/;

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: Extract<Block, { type: "list" }> | null = null;

  const flush = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", lines: paragraph });
    if (list) blocks.push(list);
    paragraph = [];
    list = null;
  };

  for (const rawLine of normalizeLineEndings(source).split("\n")) {
    const line = rawLine.replace(/[ \t]+$/, "");
    if (!line.trim()) {
      flush();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    if (bullet || numbered) {
      const tag = bullet ? "ul" : "ol";
      const text = (bullet ?? numbered)![1];
      if (list && list.tag !== tag) flush();
      if (paragraph.length) flush();
      if (!list) list = { type: "list", tag, items: [] };
      list.items.push(text);
      continue;
    }

    if (list) flush();
    paragraph.push(line.trim());
  }
  flush();
  return blocks;
}

// ---- inline ---------------------------------------------------------------

const LINK_CLASS =
  "text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:decoration-gold";

/** Returns a safe href descriptor, or null when the target is not allowed. */
function safeHref(raw: string): { href: string; external: boolean } | null {
  const url = raw.trim();
  if (/^\/(?!\/)/.test(url) || url.startsWith("#")) return { href: url, external: false };
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { href: parsed.href, external: true };
    }
    if (parsed.protocol === "mailto:") return { href: parsed.href, external: true };
  } catch {
    // not an absolute URL
  }
  return null;
}

const INLINE = /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*(?=\S)([^\n]+?)(?<=\S)\*\*|\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const key = `${keyPrefix}-${n++}`;
    const [, linkText, linkUrl, boldText, italicText] = match;

    if (linkText !== undefined) {
      const target = safeHref(linkUrl);
      if (!target) {
        nodes.push(linkText); // disallowed protocol: keep the label, drop the link
      } else if (target.external) {
        nodes.push(
          <a key={key} href={target.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            {renderInline(linkText, key)}
          </a>
        );
      } else {
        nodes.push(
          <Link key={key} href={target.href} className={LINK_CLASS}>
            {renderInline(linkText, key)}
          </Link>
        );
      }
    } else if (boldText !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold text-paper">
          {renderInline(boldText, key)}
        </strong>
      );
    } else {
      nodes.push(<em key={key}>{renderInline(italicText, key)}</em>);
    }
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ---- layout ---------------------------------------------------------------

const STYLES: Record<
  Variant,
  { p: string; ul: string; ol: string; li: string; h: Record<1 | 2 | 3, string> }
> = {
  // Long-form essays: generous line height and paragraph spacing.
  article: {
    p: "mt-6 first:mt-0 leading-[1.8]",
    ul: "mt-6 first:mt-0 list-disc space-y-2 pl-6 marker:text-gold leading-[1.8]",
    ol: "mt-6 first:mt-0 list-decimal space-y-2 pl-6 marker:text-gold leading-[1.8]",
    li: "pl-1",
    h: {
      1: "mt-12 first:mt-0 font-display text-2xl font-medium leading-snug text-paper sm:text-3xl",
      2: "mt-10 first:mt-0 font-display text-xl font-medium leading-snug text-paper sm:text-2xl",
      3: "mt-8 first:mt-0 font-display text-lg font-medium leading-snug text-paper sm:text-xl",
    },
  },
  // Short descriptions: tighter spacing, no oversized headings.
  compact: {
    p: "mt-3 first:mt-0 leading-relaxed",
    ul: "mt-3 first:mt-0 list-disc space-y-1 pl-5 marker:text-gold leading-relaxed",
    ol: "mt-3 first:mt-0 list-decimal space-y-1 pl-5 marker:text-gold leading-relaxed",
    li: "pl-1",
    h: {
      1: "mt-5 first:mt-0 font-display text-base font-medium text-paper",
      2: "mt-5 first:mt-0 font-display text-base font-medium text-paper",
      3: "mt-4 first:mt-0 font-display text-sm font-semibold uppercase tracking-wider text-paper",
    },
  },
};

type Props = {
  text: string | null | undefined;
  variant?: Variant;
  /** Typography/colour for the wrapper (e.g. "text-base text-paper"). */
  className?: string;
};

export default function RichText({ text, variant = "compact", className }: Props) {
  if (!text || !text.trim()) return null;
  const styles = STYLES[variant];
  const blocks = parseBlocks(text);

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const key = `b${i}`;
        if (block.type === "heading") {
          // The page title is the <h1>, so source "#" maps to <h2>.
          const Tag = (`h${block.level + 1}` as "h2" | "h3" | "h4");
          return (
            <Tag key={key} className={styles.h[block.level]}>
              {renderInline(block.text, key)}
            </Tag>
          );
        }
        if (block.type === "list") {
          const Tag = block.tag;
          return (
            <Tag key={key} className={styles[block.tag]}>
              {block.items.map((item, j) => (
                <li key={j} className={styles.li}>
                  {renderInline(item, `${key}-${j}`)}
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={key} className={styles.p}>
            {block.lines.map((line, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(line, `${key}-${j}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
