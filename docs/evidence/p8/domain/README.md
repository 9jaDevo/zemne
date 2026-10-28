# Custom domain verification — October 28, 2026

Primary: https://zemne.pdev.tech. Render fallback remains
https://zemne-preview.onrender.com. Same service and deployed application
commit `95992fc`; no application deployment or backend logic change required.

The owner confirms `pdev.tech` was claimed through the Hacktoberfest promotion.
This deployment uses its `zemne` subdomain. The official Week 4 category asks for
a .tech domain claimed through Hacktoberfest; it does not explicitly address
subdomains. The public post states the actual arrangement rather than guaranteeing
the judges' eligibility decision.

Render's workspace already used 2/2 included domains. Its form disclosed
$0.25/month, which the owner explicitly approved before Add Domain. DNS already
contained `zemne.pdev.tech CNAME zemne-preview.onrender.com`, TTL 14400; no DNS
record or unrelated service was changed. Authoritative NS are the four
`tech-domains.{mars,mercury,earth,venus}.orderbox-dns.com` servers. The stale
Cloudflare onboarding tab was not used to alter DNS. No restrictive CAA or
conflicting AAAA address appeared in public DNS checks.

Render verified the domain and issued the certificate. Earlier TLS requests
failed while issuance was pending; no certificate bypass was used. Final system
TLS validation succeeded. Screenshots record pending and issued statuses.

`verification.json` records the custom-host check at 18:42:50Z: health/database
200/ok; AI configured; organizer exchange/read 200, Secure+HttpOnly host cookie;
wrong-origin write 403 ORIGIN_REJECTED; public story from real gemma-4-31b-it,
three approved tributes and no-store response. `guest-write.json` records a real
same-origin 202 pending guestbook test, absent from public data. It remains a
fictional pending deployment-test entry; the published story is unchanged.
`favicon.json` records the served favicon.

Browser opened the custom-host hall, memory wall and approved Jun source dialog.
The source screenshot is genuine. A full hall screenshot failed, and an
unavailable-3D notice appeared during source navigation, consistent with the
previously documented browser/GPU limitation; this is not a new physical-device
or endurance acceptance claim. No duplicate inference call was made.

Existing DEV article `4932571` was updated, not resubmitted as another entry.
Anonymous HTTP 200 verified custom-domain link and .tech category; public
`dateModified`: **2026-10-28T18:44:32Z**. Original `datePublished` remains
**2026-10-28T07:25:43Z**. No new prize/category technology beyond the actual domain
deployment was asserted.

Retest: open new URL with normal certificate checks, inspect `/api/health`,
open the submission memorial and source buttons, sign in via a privately saved
organizer capability using the new origin, and submit fictional guest content.
Sessions are host-specific: Render-host cookies do not carry to the new hostname.
Existing management paths work when privately opened on the new origin; never
paste a capability into an issue or public evidence.

Rollback: retain/use the enabled Render fallback; remove the custom domain only
if the owner requests it. No root-domain or mail DNS migration is needed.
