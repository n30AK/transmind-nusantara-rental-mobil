# NEXUS Aggressive Growth Engine

## Mission
Maximize qualified organic visibility and booking intent for TransMind without using deceptive or manipulative search tactics.

## Operating loop
WAKE -> OBSERVE -> DISCOVER -> SCORE -> PLAN -> GUARD -> SHIP -> MEASURE -> RETEST -> SCALE/ITERATE -> AUDIT

## Opportunity classes
1. STRIKE_ZONE: indexed/visible pages with meaningful impressions, weak CTR, or positions where incremental improvement is plausible.
2. CONTENT_GAPS: genuine search intents not adequately answered by existing pages.
3. LOCAL_INTENT: location/service combinations only when the page has unique, useful local information.
4. CONVERSION_BRIDGE: search landing pages aligned with booking, fleet, WhatsApp and service intent.
5. TECHNICAL: crawlability, canonicalization, metadata, sitemap, internal links, structured data, performance.
6. REFRESH: declining or stale pages with evidence that the underlying user need remains relevant.

## Scoring
Priority = business_intent * evidence * opportunity * confidence * safety.
Never create a page solely because a keyword exists.

## Aggressive tactics allowed
- High-frequency measurement and iteration.
- Query/page opportunity mining from Search Console.
- Title/snippet experiments with truthful copy.
- Strong contextual internal linking.
- Topic clusters and hub pages.
- Useful local/service pages with differentiated information.
- Structured data that accurately represents visible content.
- Content refresh based on observed demand.
- Search-intent coverage and FAQ expansion.
- Sitemap and crawl/indexation hygiene.
- Conversion-focused landing experiences that remain useful without a booking.

## Hard blocks
- Cloaking or serving materially different content to crawlers.
- Hidden text or hidden links.
- Keyword stuffing.
- Doorway pages.
- Fake reviews, ratings, locations, organizations or affiliations.
- Automated link spam, paid ranking links, PBN/link schemes.
- Scraped or spun pages without substantial original value.
- Mass-generated thin pages whose primary purpose is ranking manipulation.
- Misleading structured data.
- Deceptive redirects or user-agent based SEO content.

## Production gates
A change may ship only when:
- JavaScript/HTML validation passes.
- Canonical and robots behavior are valid.
- No protected production route is altered unintentionally.
- Content is useful and materially differentiated.
- Structured data matches visible content.
- No hard-block tactic is detected.
- Measurement is defined before deployment.

## Scale rule
A winning experiment may be expanded only after observed evidence supports expansion. The engine must not manufacture synthetic success metrics.

## Rollback
Every automated SEO mutation must be reversible and attributable to a run/commit/opportunity id.
