# azumiuchitani.com — static website

This folder is the complete website. It is generated from the design file
`Azumi Uchitani Website.dc.html` and published as plain static files on GitHub Pages.

## Structure

```
index.html                 Home
book/ about/ art/ academy/ events/ journal/ contact/ privacy/
art/<work>/                tsuki, hinode, mushin, meguri, jaku, sei, tsuki-healing, kami, tsuki-peace, bi
program/<programme>/       shu-ha-ri, kintsugi, yoshuku, talks, coaching, calligraphy,
                           shu-ha-ri-shodo, kintsugi-individuals, yoshuku-individuals
event/amsterdam/
journal/<entry>/           story, haiku, shuhari, values, kintsugi
404.html                   served automatically by GitHub Pages
my-story/ yoshuku-japanese-art-of-manifesting/ japanesewisdomacademy/
lecture-japanese-culture-philosophy/ article-business-with-japan/
                           redirects from the old website
assets/css/site.css        all styles (design-system tokens + components + page styles)
assets/js/site.js          all behaviour (navigation, menu, filters, forms, motion)
assets/images|calligraphy|brush|brand/
sitemap.xml robots.txt CNAME .nojekyll
```

Contact links preselect the enquiry type with `?type=`:
`/contact/?type=lecture | workshop | coaching | art | speaking | media | general`.

## Updating content

Content is edited in the design file, then exported again:

1. Open `Azumi Uchitani Website.dc.html` in Claude Design and edit text directly, or ask for changes.
   - **Add an artwork:** add an entry to the `works` list (id, image, title, kanji, category, medium, description, availability).
     Put the image in `assets/images/`. Set `availability: 'Sold'` to show the commission note instead of an enquiry button.
   - **Add an event:** add it to `events` (upcoming) or `past` (archive, grouped by year).
   - **Add a Journal entry:** add it to `journal` with `month` and `year`; it appears in that month's issue.
2. Run the export (ask Claude: "re-export the static site"). This runs `export/prerender.js` then `export/build.js`
   and rewrites this folder. New images also need WebP versions (the export creates them).
3. Commit and push the folder to GitHub.

## Placeholders to replace before launch

| Where | What |
|---|---|
| `assets/js/site.js` → `CONFIG.formEndpoint` | Formspree form ID (`https://formspree.io/f/…`) |
| `assets/js/site.js` → `CONFIG.newsletterEndpoint` | MailerLite account + form ID |
| Footer, Privacy page | KvK number, retention period, "last updated" date |
| Privacy page | Legal review (marked as placeholder) |

Until the two endpoints are filled in, the forms show a polite error with Azumi's email address.

## GitHub Pages checklist

1. Create a repository (e.g. `azumiuchitani/website`) and push the **contents** of this folder to the `main` branch root.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
3. Settings → Pages → Custom domain: `azumiuchitani.com` (the `CNAME` file already contains it).
4. At the domain provider, set DNS:
   - `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - optionally `AAAA` for `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` for `www` → `<github-username>.github.io`
5. Wait for the DNS check to pass, then tick **Enforce HTTPS**.
6. Verify the domain under the account's Settings → Pages → Verified domains (protects against takeover).
7. Submit `https://azumiuchitani.com/sitemap.xml` in Google Search Console.
