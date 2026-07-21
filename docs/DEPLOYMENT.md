# Deployment Guide

## Preflight

- Confirm the final domain
- Add unique canonical URLs to all HTML pages
- Update `sitemap.xml` and the sitemap line in `robots.txt` if the domain differs
- Import verified catalog data or intentionally retain visible sample labels
- Replace the About page maker-photo placeholder
- Test from an HTTP preview, not only `file://`
- Verify Etsy, Facebook, and email links
- Run accessibility, responsive, console, and broken-path checks

## Static hosting

Upload the repository contents while preserving the directory structure. The host must serve JSON files with a normal JSON content type. No server runtime or database is required.

Recommended options include Netlify, Cloudflare Pages, GitHub Pages, Vercel static hosting, or conventional file-based web hosting. Connect the domain with the host’s documented DNS records and enable HTTPS.

## GoDaddy

GoDaddy Website Builder is not an ideal deployment target for this custom multi-file site. A domain registered at GoDaddy can point to another static host. If using conventional GoDaddy web hosting rather than Website Builder, upload the files to the web root and confirm that JSON files are served correctly.

## Forms

The quote form currently creates a prefilled email to `kennedylaserworks@gmail.com`. It does not collect data on the website. If migrating to a form provider, document the provider, update the privacy policy, add spam protection, and test success/error states before launch.
