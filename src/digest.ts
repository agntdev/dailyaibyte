// FEAT05: digest composer (docs/details.md "Daily Digest Pipeline" steps 3-4
// and "Error handling" copy). Pure module — FEAT06 fetches/filters via
// src/news.ts, then calls composeDigest and sends the result with
// parse_mode: "Markdown". No buttons, no inline keyboards (design.md).

import type { Article } from "./news.js";
import { NO_NEWS_MESSAGE, TECH_ERROR_MESSAGE } from "./strings.js";

export { NO_NEWS_MESSAGE, TECH_ERROR_MESSAGE };

export const HEADLINE_MAX_CHARS = 120;

/** "📰 *Today’s AI News Digest* (June 12, 2026)" — capped at 120 chars
 *  including date, emoji and Markdown markers (design.md format constraint):
 *  over-long headlines are truncated to 119 chars + "…". */
export function composeHeadline(date: Date): string {
  const rendered = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  const headline = `📰 *Today’s AI News Digest* (${rendered})`;
  if (headline.length <= HEADLINE_MAX_CHARS) return headline;
  return `${headline.slice(0, HEADLINE_MAX_CHARS - 1)}…`;
}

/** One brief takeaway sentence per article (details.md step 3): the title,
 *  trimmed and period-terminated — descriptions stay out of the bullet to keep
 *  takeaways one line. */
export function takeaway(article: Article): string {
  const t = article.title.trim().replace(/\s+/g, " ");
  return /[.!?…]$/.test(t) ? t : `${t}.`;
}

/**
 * Single digest message (details.md step 4):
 *   headline line (≤120 chars)
 *   up to 3 `• ` bullet takeaways (never a numbered list)
 *   plain URL of the most relevant article on its own final line
 * Caller guarantees `articles` is non-empty — the empty case is NO_NEWS_MESSAGE.
 */
export function composeDigest(articles: Article[], date: Date): string {
  const bullets = articles.slice(0, 3).map((a) => `• ${takeaway(a)}`);
  const topUrl = articles[0]!.url;
  return [composeHeadline(date), "", ...bullets, "", topUrl].join("\n");
}
