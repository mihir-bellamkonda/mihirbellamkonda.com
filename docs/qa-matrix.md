# Reading QA matrix

The automated column runs on every proposed change and every deployment. The
device column is the short manual pass for changes that affect layout, motion,
navigation, audio, or typography.

## Automated release gate

| Check | What it protects |
| --- | --- |
| Production build | The Vue application and generated pages compile together |
| Poem line counts | No source line is lost or joined during markdown conversion |
| Unique titles and paths | Every poem keeps one stable public address |
| Static reading copies | Every poem remains readable without JavaScript |
| Structured data and canonicals | Search engines receive the correct work and author metadata |
| Social preview assets | Home and poem metadata agree with complete, correctly sized JPEGs |
| Sitemap coverage | Every public poem is discoverable |
| Deterministic signatures | A poem's asemic hand does not change between visits |
| Venue URL syntax | Published links are valid HTTPS addresses |
| Collage studies resolve | Every poem has a study and every plate it names exists on disk |
| Plate standard | Each plate carries its feathered edge and sits in the folio's tonal range |
| Hand fits its box | A single-line mark never writes outside the space it was given |
| Writing plan runs forwards | The write-on reveals the marks in order and arrives at all of them |
| Torn outlines are simple | No sheet folds through itself and pinches at a corner |

Venue reachability runs weekly rather than blocking a deployment; literary
magazines are occasionally offline or hostile to robots without being dead.

## Manual device pass

| Environment | Viewport or assistive mode | Essential checks |
| --- | --- | --- |
| iPhone Safari | Current iOS, portrait and landscape | Open poem excerpts; follow poem and venue links; native share sheet; verse before visual study; play audio; swipe between poems, and confirm a pinch does not turn the page |
| iPhone Safari + VoiceOver | Current iOS | Skip link; page-title announcement; index order; player labels; previous/next navigation |
| Android Chrome | Current Android, portrait | Excerpt control; wrapping; touch targets; audio playback |
| Android Chrome + TalkBack | Current Android | Reading order; control names; expanded excerpt state |
| macOS Safari | Current release | Typography, keyboard navigation, print preview |
| macOS Safari + VoiceOver | Current release | Route changes announced; poem lines read in order; player status |
| Desktop Chrome | 1280px and 200% zoom | No horizontal scrolling; stable preview rows that never cut a first line; focus visibility; copied share link; arrow keys, and the hint gone after two uses |
| Desktop Firefox | 1280px | Layout, external links, print preview |
| Reduced motion | System setting enabled | Signatures appear without animation; the collage ignores the pointer; no essential state depends on motion |
| Print preview | Letter and A4 | One clean reading edition; no navigation, controls, or asemic marks |
| Messaging unfurl | iMessage, Slack, or another link-preview client | Home shows the portrait; poem links show their title-specific card |

## What only an eye can check

Some of the folio cannot be asserted, only watched. Give these a minute after
any change to `asemic.js`, `marginalia.js` or the collage:

| Look at | What you are looking for |
| --- | --- |
| A row signature, hovered | The hand writes in bursts and rests between words. If it glides at one rate it has become a wipe again |
| The slow plate | One poem a visit is written visibly more slowly, on its plate and its row. It is never announced |
| A plate's torn edge | Paper, not geometry. No spikes, no pinched corners, no two cut corners sharing a side |
| The collage under a pointer | Four planes moving at four rates: photograph, sheets, hand, and the found label on its own |
| The name page | One word of asemic writing in the corner, different on each visit |

Run the complete pass before a structural redesign. For a narrowly scoped
change, run the affected rows plus Desktop Chrome at 200% zoom.
