## Goal
Make the site’s light background calmer and ensure automated blogs are created from every book in the catalogue, not only fixed devotional topics.

## Changes
- Reduce the brightness of the shared light-theme background, surface, card, popover, muted, border, and section-gradient tokens while preserving text contrast and dark mode.
- Keep the change global and token-based so the homepage, blog, books, dashboard, and admin screens stay visually consistent.
- Change the daily blog publisher to select one book at a time from `book_knowledge`, prioritizing the book with the least recent blog coverage.
- Send that selected book’s title, slug, summary, topics, concepts, keywords, entities, and FAQs as the primary context to the writing agent.
- Require the generated article’s keyword, subject, and book links to match the selected book; retain duplicate-topic, originality, readability, and quality checks.
- Record the selected book in the article’s internal quality metadata so future runs can rotate fairly across all books.
- Keep existing book content unchanged; the automation may only read it for grounding and create separate blog posts.

## Verification
- Check the homepage and article listing at desktop and mobile widths for the lower-brightness background and readable contrast.
- Run targeted tests/static checks for the changed publishing flow.
- Verify the writer receives one explicit book context and that rotation does not repeatedly favor the same title.

## Technical details
- Frontend: update semantic color values in the global stylesheet rather than adding page-specific hardcoded colors.
- Automation: update `seo-daily-publisher` and `seo-blog-agent` request handling to preserve a selected `book_id`/book context through topic selection, writing, backlinks, and saved `self_check` metadata.
- No changes to book/chapter records or their content.
