# PEIC Website Editor Guide

The PEIC website uses PagesCMS so non-technical team members can update text,
images, logos, PDFs, job openings, and company details without touching code.

Every item in the PagesCMS sidebar now maps directly to one website page.

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
The hero proof panel is also editable from the Home page: kicker, large metric,
headline, supporting copy, and the four small specification cells.
The Home page also includes the engineering workflow section, proof statistics,
institutional trust cards, and the bottom call-to-action.

Products, partners, downloads, and vacancies are now managed inside their
matching page entry, so the sidebar stays one item per website page.

### Site-wide company details

Use this for:

- Company name and tagline
- Footer description
- Phone numbers and email addresses
- Registered address

For longer text fields, pressing Enter in PagesCMS now creates a visible line
break on the website. This is intended for paragraph-style copy such as
descriptions, intros, notes, testimonials, and addresses.

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

If you want the button text to say something specific such as `Download brochure`
or `Request specifications`, change the **Button wording** field for that product.

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

The entire partner card links to the **Official website URL** when present. If
that field is empty, the card falls back to the internal solutions link.

### Solutions specialties

Each Medical Specialty card has:

- Card ID for anchor links
- Title and description
- Background image
- Destination link
- Button label

The entire specialty card is clickable, so keep destination links current.

### About page facilities and institutional reach

Facilities are managed as structured address blocks:

- One **In-House Testing & R&D** block
- Two to three **Manufacturing Facility** blocks
- Up to two **Office** blocks

Each block supports a type label, title, description, and address lines.

Institutional reach cards support customer names, relationship notes, short
placeholder initials, and uploaded logos. Uploading a logo replaces the initials
placeholder automatically.

### Downloads and resources

Each resource has:

- Public title
- Category
- Card label
- Uploaded PDF/document
- Card call-to-action text

The whole resource card is clickable. When no file is uploaded, the card opens
the documentation request form. When a file is uploaded, the card opens that
document directly.

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
- **PDFs and downloadable files** for brochures, manuals, certificates, and reference documentation

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
