// FEAT04: GNews fetch + keyword relevance filtering (docs/details.md "Daily
// Digest Pipeline" steps 1-2). Pure module — no bot wiring. FEAT06 owns the
// retry-once policy and calls fetchTopArticles/filterRelevant; FEAT05 consumes
// the filtered articles to compose the digest message.

export interface Article {
  title: string;
  description: string;
  url: string;
}

/** GNews API error carrying the HTTP status so FEAT06 can distinguish an
 *  invalid key (401/403 — log, no retry) from a transient failure (retry once). */
export class GNewsError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "GNewsError";
  }
}

const GNEWS_ENDPOINT = "https://gnews.io/api/v4/search";

/** Fetch the top 10 AI-related articles, sorted by relevance (details.md §1). */
export async function fetchTopArticles(
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<Article[]> {
  const url = new URL(GNEWS_ENDPOINT);
  url.searchParams.set("q", '"artificial intelligence" OR "AI"');
  url.searchParams.set("lang", "en");
  url.searchParams.set("sortby", "relevance");
  url.searchParams.set("max", "10");
  url.searchParams.set("apikey", apiKey);

  let res: Response;
  try {
    res = await fetchFn(url.toString());
  } catch (err) {
    throw new GNewsError(`GNews request failed: ${String(err)}`, null);
  }
  if (!res.ok) {
    throw new GNewsError(`GNews responded ${res.status}`, res.status);
  }

  const body = (await res.json()) as { articles?: unknown };
  if (!Array.isArray(body.articles)) return [];
  return body.articles
    .map((a) => a as Record<string, unknown>)
    .filter((a) => typeof a.title === "string" && typeof a.url === "string")
    .map((a) => ({
      title: a.title as string,
      description: typeof a.description === "string" ? a.description : "",
      url: a.url as string,
    }));
}

// Keyword scoring (details.md §2): business/industry signal scores up,
// subfield-specific topics excluded by docs/general.md Non-Goals score down.
const BUSINESS_KEYWORDS = [
  "launch", "funding", "investment", "enterprise", "business", "market",
  "regulation", "policy", "partnership", "acquisition", "revenue", "startup",
  "industry", "model release", "release", "announce",
];
const EXCLUDED_KEYWORDS = [
  "healthcare", "medical", "clinical", "ethics", "ethical",
  "paper", "study finds", "research paper", "benchmark", "arxiv",
];

export function scoreArticle(article: Article): number {
  const text = `${article.title} ${article.description}`.toLowerCase();
  let score = 0;
  for (const kw of BUSINESS_KEYWORDS) if (text.includes(kw)) score += 2;
  for (const kw of EXCLUDED_KEYWORDS) if (text.includes(kw)) score -= 3;
  // Baseline relevance: GNews already matched the AI query; titles that name
  // AI explicitly edge out generic tech coverage.
  if (/\bai\b|artificial intelligence/i.test(article.title)) score += 1;
  return score;
}

/** Keep the 3-5 highest-scoring general-AI articles (details.md §2). Articles
 *  with a negative score (excluded subfields) are dropped even if that leaves
 *  fewer than 3 — the empty/sparse case is FEAT05's "no news" copy. */
export function filterRelevant(articles: Article[]): Article[] {
  return articles
    .map((article) => ({ article, score: scoreArticle(article) }))
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.article);
}
