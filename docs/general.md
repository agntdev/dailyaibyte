# Daily AI News Digest Bot - GENERAL Design Document

## Summary
This Telegram bot delivers a concise, daily morning summary of general AI news to business professionals. Using the GNews API, it aggregates and condenses top AI-related articles into a single digestible message sent automatically to subscribed users. The bot focuses on high-level industry trends and developments without requiring user interaction beyond passive receipt of the daily update.

## Core Entities
- **User**: Telegram user receiving the digest (subscription status tracked implicitly)
- **AI News Article**: Raw news item fetched from GNews API with AI-related content
- **Daily Summary**: Curated compilation of 3-5 key AI news points formatted as a single message
- **Subscription**: Implicit user relationship to the bot (tracked via user ID if needed later)

## External Dependencies
- **Telegram Bot API**: 
  - Basic bot messaging (sendMessage)
  - Scheduled job execution (via webhook/cron)
- **GNews API**: Fetch AI-related news articles (requires API key)
- **Persistence**: Optional user subscription tracking (simple user ID storage if subscription management is added later)

## Feature List
- [ ] Fetch top 10 general AI news articles from GNews API daily at 7:00 AM UTC
- [ ] Filter articles using keyword-based relevance scoring for "general AI" topics
- [ ] Generate concise summary combining 3-5 most relevant articles into single message
- [ ] Format summary with: 
  - Brief headline (max 120 chars)
  - Key takeaways (3 bullet points)
  - Optional link to most relevant full article
- [ ] Send summary to all subscribed users via Telegram
- [ ] Handle implicit subscription through group/channel membership (if implemented)
- [ ] Support optional opt-out mechanism (if subscription tracking is added)

## Non-Goals
- News about specific AI subfields (healthcare, ethics, etc.)
- Multiple separate headlines in daily message
- Real-time news alerts or instant updates
- User customization of summary content/format
- Interactive features (commands, buttons, replies)
- Paid subscription models or monetization
- Detailed technical analysis of AI papers/research