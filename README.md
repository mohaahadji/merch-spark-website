# Merch Spark Research Studio

A browser-local Amazon.com research workspace at https://mohaahadji.github.io/merch-spark-website/.

## Features

- Responsive four-column product discovery grid; prices, stars, ratings count, ASINs and captured BSR.
- Search using the supplied Amazon-sold novelty-shirt URL, or capture an open Amazon search tab.
- Sponsored-card exclusion, ASIN deduplication and explicit missing values.
- Price, BSR, minimum stars and ratings-count filters, sorting and pagination.
- Keyword hunter for one-, two- and three-word title phrases in your filtered lower-BSR sample; source products are visible. Frequency is not search volume.
- Shortlist, four-product comparison, product quick views and locally captured rank history.
- Local CSV/JSON imports and CSV exports, with spreadsheet-formula protection.
- Optional user-calibrated sales scenarios; no invented sales or profit defaults.
- Light/dark appearance and Spark fox branding.

## Connect real Amazon data

1. Load Merch Spark extension v3.2.0 or later in Chrome. Its source remains private at https://github.com/mohaahadji/merch-spark-extension.
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
