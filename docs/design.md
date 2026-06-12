# Daily AI News Digest Bot - UX SPEC  

## SUBSCRIPTION MECHANICS (not interactive features)  
Per the GENERAL doc, interactive features (commands, buttons, replies) are a **non-goal**. The two entry points below are not interactive features: they are the minimal subscription plumbing required by Telegram itself (`/start` is mandatory to open a bot chat) and by the GENERAL doc's "Support optional opt-out mechanism" feature (`/stop`). The bot offers no other commands, no buttons, and no conversational replies.  

- **/start** (opt-in — Telegram-mandated entry point):  
  - *Action*: Subscribe the user to the daily digest and confirm.  
  - *Response*:  
    ```  
    Good morning! 🌟 You’re receiving today’s AI News Digest for business professionals.  
    To stop receiving updates, send /stop.  
    ```  

- **/stop** (opt-out mechanism, per GENERAL doc feature list):  
  - *Action*: Unsubscribe the user from the daily digest and confirm.  
  - *Response*:  
    ```  
    You’ve been unsubscribed from the AI News Digest. Send /start to rejoin.  
    ```  

- **Anything else** (other commands, text, replies):  
  - *Action*: Silently ignored. The bot is delivery-only and never engages in interaction.  

---

## DIALOG STATE MACHINE  
1. **Initial State**:  
   - *Trigger*: User starts bot with `/start`.  
   - *Action*: Send welcome message and subscription status (if tracked).  

2. **Daily Delivery State**:  
   - *Trigger*: Scheduled daily at 7:00 AM UTC.  
   - *Action*: Send AI news summary message.  
   - *Transitions*:  
     - If GNews API fails → Error state (see below).  
     - If user replies with `/stop` → Unsubscribe state.  

3. **Error State**:  
   - *Trigger*: API failure or no news found.  
   - *Action*: Send fallback message (e.g., "No news today" or "Technical error – try again later").  

---

## NO INLINE KEYBOARDS  
Inline keyboard buttons are interactive features and therefore out of scope (GENERAL doc Non-Goals). The daily summary message contains **no buttons**:  

- The optional link to the most relevant full article (GENERAL doc Feature List) is included as a **plain URL on its own line** at the end of the message body — no "Read More" button.  
- Opting out is done by sending `/stop` (see Subscription Mechanics) — no "Stop Digest" button.  

---

## MESSAGE COPY & TONE  
- **Daily Summary Headline**:  
  ```  
  📰 *Today’s AI News Digest* (Date)  
  ```  

- **Summary Body**:  
  ```  
  1. [Brief takeaway 1]  
  2. [Brief takeaway 2]  
  3. [Brief takeaway 3]  
  ```  

- **Error/Empty State**:  
  ```  
  No significant AI news today. Check back tomorrow!  
  ```  

- **Tone**: Professional, concise, and approachable (e.g., "Key trends to watch" instead of technical jargon).  

---

## EDGE CASES  
- **Invalid Input**: Ignore non-command messages.  
- **Timeouts**: Retry GNews API request once; if failed, send error message.  
- **Unknown Commands**: Silently ignored (no interactive responses; see Subscription Mechanics).  
- **Empty News Feed**: Send "No news today" with a light-hearted note.  
- **Permission Errors**: If API key is invalid, log error and send generic message.  

---

## i18n (Translatable Strings)  
- All user-facing text (welcome messages, error messages, daily summary structure).  
- Example: "No significant AI news today." → "Sem notícias relevantes de IA hoje." (Portuguese), "Heute keine relevanten KI-Nachrichten." (German).  

--- 

*Note: Subscription tracking is optional in this spec. If implemented, UX flows for `/start`/`/stop` will require backend support.*