# Hosting Note for PEIC

The production website is hosted on Vercel and automatically deploys from the GitHub repository.

- Production domain: `https://www.peic.in`
- `https://peic.in` redirects to the `www` address.
- Contact enquiries use Web3Forms and are delivered to `sital.shah@peic.in`.
- The separate Netlify test project is not required for production.

The original Netlify instructions below are retained only as historical setup notes.

This is the simplest safe setup. You do not need to understand coding.

## What You Need Before Starting

1. An email address that should own the website account.
2. Access to wherever the `peic.in` domain was purchased.
3. A GitHub account. This is recommended because it gives the website a change history and makes future updates easier.
4. The email address that should receive website enquiry notifications.

Do not send passwords to Codex or place passwords in the website files.

## Step 1: Create a GitHub Account

Skip this step if you already have one.

1. Go to `https://github.com/`.
2. Click **Sign up**.
3. Use an email address controlled by the company.
4. Verify the email.
5. Turn on two-factor authentication when prompted.

What to provide afterward:

- Your GitHub username only
- Do not provide your password

## Step 2: Create a Netlify Account

1. Go to `https://app.netlify.com/signup`.
2. Choose **Sign up with GitHub**.
3. Approve Netlify's connection to GitHub.
4. Use a company-controlled email and team name.
5. Turn on two-factor authentication in Netlify account settings.

What to provide afterward:

- The email used for Netlify
- The Netlify team name
- Do not provide your password

## Step 3: Put the Website on GitHub

Codex can create the repository, commit the website, and push it after you have created the GitHub account and authorized GitHub access in Codex.

Recommended repository name:

`peic-website`

Recommended visibility:

`Private`

## Step 4: Create the Netlify Site

1. Log in to Netlify.
2. Click **Add new project**.
3. Choose **Import an existing project**.
4. Choose **GitHub**.
5. Select the `peic-website` repository.
6. Leave the build command empty.
7. Set the publish directory to `.` if Netlify does not detect it automatically.
8. Click **Deploy**.

Netlify will create a temporary address ending in `.netlify.app`.

## Step 5: Test the Temporary Website

Before connecting `peic.in`, test:

1. Home page
2. Every navigation link
3. Mobile menu
4. Contact form
5. Form notification email
6. Phone links
7. Email links
8. Privacy page
9. A fake missing URL to verify the 404 page

## Step 6: Contact-Form Email Delivery

The website uses Web3Forms because Netlify email notifications require a paid plan.

- Enquiries are delivered to `sital.shah@peic.in`.
- The free Web3Forms plan currently allows up to 250 submissions per month.
- No Netlify form-notification subscription is required.

After each deployment, submit one test enquiry and confirm that it reaches the inbox. Also check the spam folder during the first test.

## Step 7: Connect `peic.in`

1. In Netlify, open **Domain management**.
2. Click **Add a domain**.
3. Enter `peic.in`.
4. Also add `www.peic.in`.
5. Choose `peic.in` as the primary domain.
6. Netlify will show DNS records that must be added.
7. Log in to the company where the domain was purchased.
8. Open DNS settings.
9. Add exactly the records Netlify shows.
10. Do not delete email/MX records. Deleting them can break `@peic.in` email.

If you are unsure at this point, provide:

- The name of the domain registrar, such as GoDaddy, Namecheap, Cloudflare, or another company
- A screenshot of the DNS page with sensitive values hidden

Do not provide the registrar password.

## Step 8: Enable HTTPS

Netlify normally creates the security certificate automatically.

1. Open **Domain management**.
2. Find **HTTPS**.
3. Confirm that the certificate is active.
4. Confirm that `http://peic.in` redirects to `https://peic.in`.

## Step 9: Give Codex Access Safely

The preferred access method is through installed GitHub/Netlify integrations, not by sharing passwords.

For GitHub:

1. Connect/authorize the GitHub app in Codex when prompted.
2. Tell Codex the repository name.

For Netlify:

1. If a Netlify connector is available, authorize it in Codex.
2. Otherwise, you can perform the few Netlify dashboard steps from this guide while Codex handles all website files through GitHub.

Never paste these into chat or website files:

- Passwords
- Two-factor codes
- Email passwords
- Domain-transfer codes
- Credit-card details
- Long-lived private API tokens

## Step 10: Launch Checklist

Do not connect the main domain until:

- Real contact details are visible
- Contact-form delivery is tested
- Statistics and legal claims are approved
- Fake testimonials are removed or replaced
- Current jobs are confirmed
- Certificates and downloads are real
- Partner relationships and URLs are confirmed
- Privacy policy is approved
- Mobile and desktop testing passes

## What to Send Back to Codex

Send only:

1. GitHub username
2. GitHub repository name, after it exists
3. Netlify team name
4. Temporary `.netlify.app` URL
5. Domain registrar name
6. Which email should receive form notifications
7. Whether GitHub and any Netlify connector have been authorized in Codex

No passwords are needed.
