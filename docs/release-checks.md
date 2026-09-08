# Release checks and title writing

Each title writes itself automatically once per tab session. Reloading or
returning to a poem shows its typeset title immediately. There is no replay
control on poem pages. Reduced-motion readers get the typeset title immediately.
Words write in reading order,
finishing one row before starting the next. The whole title writes in 1.1 seconds
and rests for 650ms before becoming type (previously 2.5 seconds total).
Switching reduced motion on
settles an in-progress reveal immediately. Storage restrictions fall back to
in-memory visit tracking; without storage, a full reload begins a new session.

## Before a release

Run `npm run verify` for the unit tests and complete production build. Then run
`npm run test:browser`; the Playwright configuration starts the built site's
static server, including the generated 404 page rather than a SPA fallback.
Install Chromium once with `npx playwright install chromium`.

Browser checks cover every poem at desktop and 320px phone widths, opening/index
navigation, malformed and missing URLs, missing assets and runtime exceptions,
keyboard navigation, browser back, first/repeat title visits, sequential writing,
reduced-motion changes, and blocked session storage. Poem text and line counts
come from the generated corpus, so new poems join the suite automatically.

The deployment workflow runs these checks before uploading the site. A failure
at this stage prevents deployment. It then writes a release marker containing
the commit and entry script, deploys, waits for that exact release to appear,
and repeats the browser suite against the public domain. Publisher links are
checked after deployment, so an outside publisher's outage does not prevent a
site repair. Live checks also run every Monday and can be started manually from
the “Check live site” workflow. GitHub may delay scheduled runs.

## Failures

Failed runs appear in GitHub Actions; existing account notification preferences
control notifications. There is no separate email or messaging integration.
Browser failures retain traces, screenshots, and a report for 14 days. A failure
after publication is reported, but does not automatically roll back the site.

The link check identifies missing pages, server errors, and network failures.
Authentication, bot protection, and rate limits are explicitly reported as
restricted; these responses do not establish that the article is still present.
Browser smoke checks use Chromium; they are not a complete accessibility audit
or a replacement for occasional checks in Safari and Firefox.
