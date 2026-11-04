# Merch Spark

The public landing page for **Merch Spark**, an independent Chrome extension for Amazon Merch on Demand sales reporting, variant insights, design libraries, and reviewed catalog edits.

Suggested repository: **`merch-spark-website` — Public**.

## What's included

The landing page, Spark fox and wordmark, feature descriptions, clearly marked sample dashboard artwork, About, Contact, Privacy, Terms, and a custom 404 page. Amazon Ads access remains described as pending. No public installation link, subscription pricing, testimonials, or Amazon endorsement is invented.

The extension source belongs in the separate private `merch-spark-extension` repository. No extension account data or hosting credentials are included here.

## Edit and preview

Requires Node.js 20 or newer. No package installation or framework is required.

```sh
npm run build
npm run check
npm run preview
```

Open the printed local preview URL. Edit the HTML, CSS, and JavaScript under `site/`, then build again. `dist/` is generated and ignored by Git.

## Publish on GitHub Pages

1. Create the public `merch-spark-website` repository and push this directory's contents to `main`.
2. Under **Settings → Pages**, choose **GitHub Actions** as the publishing source.
3. Run **Publish Merch Spark website** under Actions, or push a commit to `main`.
4. Use the URL returned by the Pages deployment as the extension's website.

The included workflow follows GitHub's [custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). It builds, checks links and assets, uploads only `dist/`, and deploys the generated website.

The build handles a project URL such as `https://YOUR-USERNAME.github.io/merch-spark-website/`, an account Pages site, or a custom domain. To test the repository path locally:

```sh
BASE_PATH=/merch-spark-website/ npm run build
npm run check
npm run preview
```

## Availability and branding

The existing contact address and project identity are retained from the current published landing page. Add your Chrome Web Store URL to the primary call to action once a public listing exists. Keep sample data labeled, and update the privacy notice when product data handling changes.

Source publication does not create a subscription service or an Amazon Ads authorization. A backend, billing, accounts, and public Ads onboarding would be separate work.
