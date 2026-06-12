// Feature registry (docs/work_breakdown.json). Each FEAT task contributes an
// installer; ORDER MATTERS — command/membership features go first, the FEAT03
// silent-ignore catch-all must stay LAST so it only sees unhandled updates.

import type { Feature } from "./bot.js";
import { startFeature } from "./features/start.js";
import { stopFeature } from "./features/stop.js";

export const defaultFeatures: Feature[] = [
  startFeature, // FEAT01 /start opt-in
  stopFeature, // FEAT02 /stop opt-out
  // FEAT07 group/channel membership → installed by its task
  // FEAT06 digest delivery job  → installed by its task
  // FEAT03 silent-ignore fallback — KEEP LAST
];
