# PEIC Website Editor Guide

The PEIC website uses Pages CMS for non-technical editing.

## Sign In

1. Open `https://app.pagescms.org`.
2. Choose **Sign in with GitHub**.
3. Approve access when GitHub asks.
4. Select the repository `aayush570/peic-website`.

## How Content Is Organized

The Pages CMS sidebar follows the website's navigation:

1. Home page
2. Products page
3. Solutions page
4. About page
5. Service page
6. Resources page
7. Careers page
8. Contact page
9. Site-wide company details

Open the page you want to change. Its hero, section headings, introductions,
cards, images, and calls to action are grouped together there.

The Home page includes both Core Capabilities cards. Each card's image, title,
description, tick-list items, link, and button text can be edited independently.

Products, partners, downloads, and vacancies are shown directly below their
respective page settings as separate repeatable lists.

### Site-wide company details

Use this for:

- Company name and tagline
- Footer description
- Phone numbers and email addresses
- Registered address

### Manufactured products

Each product has:

- Product name
- Certification/status line
- Description
- Product image
- Technical-specification PDF
- Visitor action: enquiry only, form before download, or public download
- Button wording

Use **Add item** to add a product. Use the reorder control to change display order.

Use **Enquiry only** for configurable, sensitive, tender-specific, or incomplete
specifications. The visitor submits their details and PEIC contacts them; no PDF
is released.

Use **Form required — then download PDF** for standard brochures or datasheets
where lead capture is useful. PEIC receives the visitor's details before the
uploaded PDF opens.

Use **Public PDF — no form required** only for documents intended for unrestricted
distribution. If no PDF is uploaded, the website automatically falls back to
**Enquiry only**.

### Partner companies

Each partner has:

- Name
- Global or domestic group
- Country and flag
- Description
- Product-category labels
- Internal solutions link
- Official website URL
- Logo

### Downloads and resources

Each resource has:

- Public title
- Category
- Card label
- Uploaded PDF/document
- File note such as `PDF · 2.4 MB`

When a file is uploaded, the website automatically changes the button from **Request** to **Download**.

### Job vacancies

Each job has:

- Job title
- Department/category
- Location
- Employment type
- **Show as open vacancy** switch

Turn the switch off to remove a vacancy from the website without deleting its details.

### About page: customers, testimonials and certificates

This section manages:

- Customer names, relationship notes, and logos
- Approved testimonials
- Certification details and certificate PDFs

Turn **Show on website** off to hide a testimonial.

## Uploading Files

Use:

- **Images and logos** for JPG, PNG, WebP, or SVG files
- **PDFs and downloadable files** for brochures, manuals, certificates, and case studies

Use clear filenames, for example:

- `horizontal-sterilizer-front.webp`
- `angiodynamics-logo.svg`
- `iso-13485-certificate-2026.pdf`

Do not upload:

- Internal or confidential documents
- Customer logos without permission
- Unapproved testimonials
- Expired certificates without clearly marking them
- Images copied from Google or another company's website

## Saving and Publishing

1. Make the change.
2. Click **Save**.
3. Pages CMS commits the change to GitHub.
4. Vercel automatically deploys it.
5. Allow approximately one to three minutes.
6. Check `https://www.peic.in`.

Every change is stored in Git history and can be reversed by a technical administrator.

## Safe Editing Rules

- Confirm facts before publishing.
- Preview spelling, phone numbers, emails, and links.
- Keep product descriptions concise.
- Use optimized images where possible.
- Do not change the `enquiry_email` field; form delivery is configured separately.
- Ask a technical administrator before deleting large groups of entries.

## If a Change Does Not Appear

1. Wait three minutes.
2. Refresh the page.
3. Try a private/incognito browser window.
4. Check whether the Pages CMS save succeeded.
5. Check the latest Vercel deployment.
6. Contact the website administrator with the page and field changed.
