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

Venue reachability runs weekly rather than blocking a deployment; literary
magazines are occasionally offline or hostile to robots without being dead.

## Manual device pass

| Environment | Viewport or assistive mode | Essential checks |
| --- | --- | --- |
| iPhone Safari | Current iOS, portrait and landscape | Open index excerpts; follow poem and venue links; copy link; play audio |
| iPhone Safari + VoiceOver | Current iOS | Skip link; page-title announcement; index order; player labels; previous/next navigation |
| Android Chrome | Current Android, portrait | Excerpt control; wrapping; touch targets; audio playback |
| Android Chrome + TalkBack | Current Android | Reading order; control names; expanded excerpt state |
| macOS Safari | Current release | Typography, keyboard navigation, print preview |
| macOS Safari + VoiceOver | Current release | Route changes announced; poem lines read in order; player status |
| Desktop Chrome | 1280px and 200% zoom | No horizontal scrolling; focus visibility; copy link; arrow keys |
| Desktop Firefox | 1280px | Layout, external links, print preview |
| Reduced motion | System setting enabled | Signatures appear without animation; no essential state depends on motion |
| Print preview | Letter and A4 | One clean reading edition; no navigation, controls, or asemic marks |
| Messaging unfurl | iMessage, Slack, or another link-preview client | Home shows the portrait; poem links show their title-specific card |

Run the complete pass before a structural redesign. For a narrowly scoped
change, run the affected rows plus Desktop Chrome at 200% zoom.
