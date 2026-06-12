// Feature registry (docs/work_breakdown.json). Each FEAT task contributes an
// installer; ORDER MATTERS — command/membership features go first, the FEAT03
// silent-ignore catch-all must stay LAST so it only sees unhandled updates.

import type { Feature } from "./bot.js";
import { startFeature } from "./features/start.js";
import { stopFeature } from "./features/stop.js";
import { digestJobFeature } from "./features/digest-job.js";
import { membershipFeature } from "./features/membership.js";
import { fallbackFeature } from "./features/fallback.js";

export const defaultFeatures: Feature[] = [
  startFeature, // FEAT01 /start opt-in
  stopFeature, // FEAT02 /stop opt-out
  membershipFeature, // FEAT07 implicit group/channel subscription
  digestJobFeature, // FEAT06 digest delivery job (no-op without GNEWS_API_KEY)
  fallbackFeature, // FEAT03 silent-ignore fallback — KEEP LAST
];
