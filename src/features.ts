// Feature registry (docs/work_breakdown.json). Each FEAT task contributes an
// installer; ORDER MATTERS — command/membership features go first, the FEAT03
// silent-ignore catch-all must stay LAST so it only sees unhandled updates.

import type { Feature } from "./bot.js";

export const defaultFeatures: Feature[] = [
  // FEAT01 /start opt-in        → installed by its task
  // FEAT02 /stop opt-out        → installed by its task
  // FEAT07 group/channel membership → installed by its task
  // FEAT06 digest delivery job  → installed by its task
  // FEAT03 silent-ignore fallback — KEEP LAST
];
