// Runtime configuration (docs/details.md "Configuration"). Read lazily by
// main.ts so the harness can construct the bot with explicit options and no
// env dependence.

export interface BotConfig {
  /** GNews API key (GNEWS_API_KEY env). null = digest pipeline cannot fetch. */
  gnewsApiKey: string | null;
  /** Hour (UTC) the daily digest job fires (DIGEST_HOUR_UTC env, default 7). */
  digestHourUtc: number;
}

export function configFromEnv(): BotConfig {
  const hour = Number(process.env.DIGEST_HOUR_UTC ?? "");
  return {
    gnewsApiKey: process.env.GNEWS_API_KEY || null,
    digestHourUtc: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 7,
  };
}
