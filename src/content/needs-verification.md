---

## Needs verification

Items 1 to 10 from Checkpoint C were reviewed by Chat and accepted, with four wording edits that are now applied (SJF "often estimate", SRTF tie sentence removed, SJF mistake 3 rewritten, Round Robin "One moment where sources differ"). What remains open:

1. **Analytics and cookies** (About, privacy): "a privacy-friendly analytics service that sets no cookies and does not follow you across sites". Cloudflare's documentation says (quotes at Checkpoint D) that Web Analytics uses no client-side state and does not fingerprint visitors. To confirm on the live site.
2. **"Nothing you enter is sent anywhere"** (About, privacy): the beacon sends `landingPath` ("The landing page URL") and `referrer` ("The referring page URL"). Cloudflare's page does not say whether query strings are kept. If they are, a visitor who opens a share link sends its process numbers to the analytics service. To check at Checkpoint D in the browser's network panel on the live site.
3. **Testing claim** (About, accuracy): "Three kinds of automated checks back this up." Now also true at deploy time: the Cloudflare build command runs the fast tests before building, so a failing test stops a deploy.
