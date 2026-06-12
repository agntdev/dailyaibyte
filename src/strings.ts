// INT01: every user-facing string in one module (docs/details.md "i18n") so
// the copy can be translated as a unit. Feature modules import from here and
// re-export their own constants to keep their public APIs stable.

export const START_REPLY =
  "Good morning! 🌟 You’re receiving today’s AI News Digest for business professionals.\n" +
  "To stop receiving updates, send /stop.";

export const STOP_REPLY =
  "You’ve been unsubscribed from the AI News Digest. Send /start to rejoin.";

export const GROUP_CONFIRMATION =
  "This group will now receive the daily AI News Digest every morning at 7:00 AM UTC. " +
  "An admin can remove me at any time to stop the digest.";

export const NO_NEWS_MESSAGE = "No significant AI news today. Check back tomorrow!";

export const TECH_ERROR_MESSAGE = "Technical error – try again later.";
