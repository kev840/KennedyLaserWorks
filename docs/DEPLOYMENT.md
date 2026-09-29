# Deployment Guide

## Preflight

- Confirm that `https://kennedylaserworks.com` is the final domain
- If the domain changes, update canonical, Open Graph, structured-data, sitemap, and robots URLs together
- Update `sitemap.xml` and the sitemap line in `robots.txt` if the domain differs
- Run `npm run products:generate` and `npm run validate` against the verified 65-listing snapshot before publishing files
- Confirm that the dated price disclosure appears above the catalog
- Test from an HTTP preview, not only `file://`
- Verify Etsy, Facebook, and email links
- Run accessibility, responsive, console, and broken-path checks
- Configure the host to serve `404.html` for unknown paths
- Configure HTTPS, compression, long-lived caching for versioned static assets, and security headers at the host

## Static hosting

Upload the repository contents while preserving the directory structure. The host must serve JSON files with a normal JSON content type. No server runtime or database is required.

Recommended options include Netlify, Cloudflare Pages, GitHub Pages, Vercel static hosting, or conventional file-based web hosting. Connect the domain with the host’s documented DNS records and enable HTTPS.

## GoDaddy

GoDaddy Website Builder is not an ideal deployment target for this custom multi-file site. A domain registered at GoDaddy can point to another static host. If using conventional GoDaddy web hosting rather than Website Builder, upload the files to the web root and confirm that JSON files are served correctly.

## Forms

The custom-work and contact inquiry forms both POST multipart data to the public Basin endpoint `https://usebasin.com/f/bdd87e7659a2` through BasinJS. They render success and error states on the site. The production Cloudflare Turnstile public site key is set as `data-basin-turnstile-sitekey` on both forms. Before launch, verify the Basin dashboard secret and domain configuration, then test a real submission from the production domain. Never put the Turnstile secret or Basin account API key in website source.
