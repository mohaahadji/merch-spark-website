# Merch Spark Website & Research Studio

Public homepage: https://mohaahadji.github.io/merch-spark-website/.

Research Studio: https://mohaahadji.github.io/merch-spark-website/research/. Product Discovery and Keyword Hunter are directly linked at /research/#discover and /research/#keywords.

## Features

- Responsive four-column product discovery grid; prices, stars, ratings count, ASINs and captured BSR.
- Search using the supplied Amazon-sold novelty-shirt URL, or capture an open Amazon search tab.
- Sponsored-card exclusion, ASIN deduplication and explicit missing values. Only listings with an Amazon “bought in past month” badge are collected and displayed. The badge text, numeric lower bound and capture time are retained; these are separate from modeled sales. Pages with no qualifying badges produce an empty result, not cached results from another search.
- Price, BSR, minimum stars and ratings-count filters, sorting and pagination.
- Keyword hunter for one-, two- and three-word title phrases in your filtered lower-BSR sample; source products are visible. Frequency is not search volume.
- Shortlist, four-product comparison, product quick views and locally captured rank history.
- Local CSV/JSON imports and CSV exports, with spreadsheet-formula protection.
- Optional user-calibrated sales scenarios; no invented sales or profit defaults.
- Light/dark appearance and Spark fox branding.

## Connect real Amazon data

1. Load Merch Spark extension v3.2.5 or later in Chrome. Its source remains private at https://github.com/mohaahadji/merch-spark-extension.
2. In the extension's settings, enable optional Amazon.com research access.
3. Refresh the public research site, click Connect Spark, and search a niche.
4. Click Get BSR & details to enrich the visible products. Collection has saved progress and a Stop control. It pauses if Amazon blocks a request or requests verification.

The extension injects a small bridge only on this GitHub Pages project's URL. The bridge accepts public research actions only. It cannot read private Merch account data, keys, preferences or bulk jobs, and cannot submit Amazon edits. `Capture open tab` reads public search-result cards from an Amazon.com search tab, not the full page or account navigation. No CAPTCHA bypass, proxy bypass or stored-cookie extraction is implemented.

A normal static website cannot fetch Amazon cross-origin. The extension connection is the live data path; local import is the fallback. There is no public Chrome Web Store download invented here. Imported rows are labeled and are not claimed to be Amazon-verified. Search filters are not proof of Merch on Demand membership.

## Sales model

Estimates are disabled until the user supplies a reference BSR and known monthly units. The explicit model is `reference units × (reference rank / product rank)^exponent`, restricted to compatible Clothing/Fashion parent ranks. Its 0.5×–2× range is a scenario band, not a confidence interval. Optional royalties use the user's own per-unit assumption. Actual competitors' unit sales and profit are unknown.

Amazon's explanation of BSR: https://sell.amazon.com/blog/amazon-best-sellers-rank.

## Development and hosting

Requires Node 20+. No dependencies to install.

```sh
npm run build
npm run check
npm test
npm run preview
```

For the GitHub Pages project path:

```sh
BASE_PATH=/merch-spark-website/ npm run build
npm run check
```

Edit `site/`, not generated `dist/`. GitHub Actions builds, validates links and assets, runs model tests and deploys only `dist/`. Research data is stored in each browser; no collected products, credentials or runtime account data are committed to this public repository. The extension source remains in its separate private repository. No backend or subscription service is created.

### Purchase-badge-only research

CSV/JSON imports require `boughtPastMonthLabel` in addition to ASIN and title, e.g. `50+ bought in past month`. Labels such as `1K+ bought in past month` are parsed to a lower bound of 1,000 for export; the original label remains visible. Unbadged legacy records and imported rows are excluded from results, shortlist views and keyword sources. The badge is a captured Amazon statement, not an exact unit-sales report.

Research discovery loads additional Amazon pages as the user scrolls, retaining previous matches and deduplicating ASINs. Brand/title exclusions cover the requested franchise list, including punctuation aliases. Monthly purchase filters and sorting use Amazon badge thresholds (50+, 100+, 1K+), not exact sales totals. All active filters combine with AND. Blocked requests pause automatic loading without retrying. A load-more button and auto-load toggle are available; collections are limited to 5,000 stored products.

Version 3.2.3 reads rendered cards in a dedicated inactive Amazon search tab instead of a separate anonymous HTML fetch. It reuses only its own tab and exposes only public product cards. Nested purchase badges and Peanuts exclusions are supported. Repeated page contents stop collection; three successive pages without new filter matches pause automatic loading with an explanation. Refresh the extension and website to enable the new collector.

Current behavior (3.2.5): searches use a paced background GET to the fixed Amazon.com search endpoint and never create or navigate tabs. Amazon verification, timeouts and HTTP errors pause collection; opening/capturing a browser tab is an explicit user action only. The independent Keyword Hunter has its own niche search, one/three/five-page scans, stored source collection, minimum purchase badge, optional BSR, phrase length, frequency and exclusion filters. It requires a purchase badge but no BSR by default. A snapshot of discovery listings can be copied explicitly. Discovery and keyword searches preserve separate collections. Keyword frequency and badge thresholds are research sample evidence, not keyword search volume or exact sales.

Version 3.2.6: Keyword Hunter generates only two-to-five-word phrases; single-word output is unavailable, including for legacy size=1 inputs. Newly loaded product matches append below the existing collection in the selected batch sort order. Explicit filter/sort changes re-sort the current collection. Added Justin Bieber, Pokémon, Third Eye Blind (including Third Eye Blink), Hot Wheels, Jurassic Park/World, Sesame Street, Coca-Cola, Barbie, Metallica (including Mettalica), and Legend of Zelda exclusions. Matching handles accents, punctuation and the listed spelling variants in both brand and title. Saved/imported website records are filtered too.

The homepage introduces the extension and both research tools, with direct calls to action into the studio. Existing research uses the same origin and local-storage keys, preserving stored collections, shortlist and preferences. App view hashes support direct links and browser navigation; earlier root #discover/#keywords/#saved links redirect into /research/. Extension settings now link directly into the studio. Extension access remains private; no public store listing or downloadable release is claimed.
