# Daily AI News Digest Bot - UX SPEC  

## COMMAND TREE  
- **/start**:  
  - *Action*: Welcome message with digest info and optional opt-in/opt-out (if subscription tracking is implemented).  
  - *Response*:  
    ```  
    Good morning! 🌟 You’re receiving today’s AI News Digest for business professionals.  
    To stop receiving updates, reply with /stop.  
    ```  

- **/stop**:  
  - *Action*: Unsubscribe user from daily digest (if subscription tracking is implemented).  
  - *Response*:  
    ```  
    You’ve been unsubscribed from the AI News Digest. Reply with /start to rejoin.  
    ```  

- **/help**:  
  - *Action*: Explain bot functionality.  
  - *Response*:  
    ```  
    I deliver a daily morning summary of general AI news for business professionals.  
    No interaction needed – just enjoy your digest! 🚀  
    ```  

- **Unknown Commands**:  
  - *Action*: Ignore or respond with:  
    ```  
    I’m here to deliver your AI news digest. Type /help for more info.  
    ```  

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

## INLINE-KEYBOARD LAYOUT  
- **Daily Summary Message**:  
  - *Buttons*:  
    - **Read More** (if a primary article link exists).  
      - *Callback*: Open article URL.  
    - **Stop Digest** (optional, if subscription tracking is implemented).  
      - *Callback*: Trigger `/stop` command.  

---

## MESSAGE COPY & TONE  
- **Daily Summary Headline** (max 120 characters):  
  ```  
  📰 *Today’s AI News Digest* (Date)  
  ```  
  - *Format constraint*: The rendered headline line, including the date, emoji, and Markdown markers, must not exceed **120 characters**. If a generated headline would exceed the limit, truncate it to 119 characters and append an ellipsis (…).  

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
- **Unknown Commands**: Respond with `/help`-style message.  
- **Empty News Feed**: Send "No news today" with a light-hearted note.  
- **Permission Errors**: If API key is invalid, log error and send generic message.  

---

## i18n (Translatable Strings)  
- All user-facing text (welcome messages, error messages, button labels, daily summary structure).  
- Example: "Read More" → "Ler Mais" (Portuguese), "Weitere Informationen" (German).  

--- 

*Note: Subscription tracking is optional in this spec. If implemented, UX flows for `/start`/`/stop` will require backend support.*