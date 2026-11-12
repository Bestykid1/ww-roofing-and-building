# RubberBond redesign review

Prepared 12 November 2026. Review before live publication.

## Scope

Astro framework retained. New flat-roof-first homepage, charcoal/orange identity, cropped supplied WW logo, RubberBond page, dedicated Mount St Mary case study, residential/commercial pages, and revised About, projects, services, areas and contact journeys. Existing URLs remain available.

Verified business facts are retained in `src/lib/business.ts`. No reviews, prices, experience figures or universal warranties were invented.

## Evidence and rights

- https://flex-r.co.uk/case-study/mount-st-mary/ — WW installation role, 953 m², Richmond Hill, May 2025, AVCL/tapered insulation, three trained operatives with labour support, S9 Construction and Den Architecture. WW's contribution is described as the roofing package within the wider development.
- https://flex-r.co.uk/audience/sri-contractors/ — Specialist Registered Installer scheme, training, support and project-specific warranties.
- https://flex-r.co.uk/training/ — training/support. Its general 50-year and 20-year marketing statements were not used as blanket project promises.
- https://flex-r.co.uk/audience/rubberbond/?range_id=9 — system and component information. This page contains an older certificate reference; the more specific document currently linked from Downloads was used instead.
- https://flex-r.co.uk/downloads/?audience_id=10 — current supplier download listing.
- https://flex-r.co.uk/wp-content/uploads/sites/2/2023/07/RubberBond-FleeceBack-BBA-2022-6056ps3i1.pdf — certificate 22/6056, Product Sheet 3; at least 35 years under stated normal-service, installation and maintenance conditions. This is an assessment, not an individual roof guarantee. The supplier-linked document was inspected; current validity should be confirmed with BBA when specifying an actual project.
- https://flex-r.co.uk/about-us/ — supplier and installer roles.
- https://www.rushmooreroofing.com/ and https://wmartinroofing.co.uk/ — visually inspected for photography, typography, navigation and contact hierarchy. Original WW design created.

The user expressly confirmed permission to reuse Mount St Mary case-study photographs. Images `mount-st-mary-1/2/3` were downloaded from that page, with WebP derivatives generated locally. Flex-R logo is the genuine supplier asset from its website and is used to identify the scheme supplier, subordinate to WW branding. The supplied email-signature image was cropped to its left logo only, preserving proportions. No generated or stock project photography is used.

## Enquiry behaviour

The form validates required fields and prepares an email to the verified business address. Visitors must send it in their email application. It never claims delivery. Direct email and telephone links remain available. The old thank-you URL is retained but no longer claims an enquiry was received merely by visiting it. Direct server delivery and mailbox receipt have not been verified; arrange and test a production endpoint before switching to a direct-submit form.

## Verification and launch notes

- Production build: 35 pages generated.
- Static internal links and image URLs: no missing targets.
- Coverage updated from the owner's clarification: RubberBond flat roofing across Yorkshire and beyond; other roofing and building work generally across Leeds and surrounding areas. Applied to visible copy, contact journey, metadata and structured data.
- Browser review: desktop homepage and project page; phone homepage, navigation, project and contact layouts; tablet flat-roofing page. Mobile menu open/close and Escape, FAQ expansion, required fields, malformed email validation and email preparation status checked. No enquiry was sent.
- Narrow-screen menu wrapping and contact-column/email overflow corrected. Screenshots supplied with the handover.
- Review hosting is separate from the live business domain.
- Existing dependency audit reports vulnerabilities in Astro 5 and its dependency tree. A major framework upgrade was not mixed into this visual rebuild. Resolve the toolchain audit before production launch, then rebuild and repeat checks.
- Confirm project-specific warranty terms at quotation stage. Do not market the BBA service-life assessment as a warranty.
