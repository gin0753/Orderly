# Portfolio presentation summary

Orderly is a full-stack ordering project built with Next.js/React and NestJS/PostgreSQL. The strongest demonstration is a customer journey followed by the short Admin recording, then a discussion of server-authoritative pricing, immutable order snapshots, owner-scoped reads and separate identity domains.

Suggested recruiter review (3–5 minutes):

1. Open the README and Customer demo. The demo was reachable on 13 October 2026; do not infer that all current source is deployed.
2. Watch the 75-second local synthetic Admin walkthrough: queue/counts, search/filter/detail, status progression, product create/edit, explicitly labeled protected API lifecycle operations, category availability and reorder.
3. Review the storefront, checkout, history and Admin screenshots. All captures use 1440x900 and synthetic identities.
4. Inspect schema/controllers and the latest scoped acceptance reports. Discuss what real database tests prove and why mocked provider tests cannot replace staging acceptance.

Interview talking points: deriving customer ownership from a live session rather than payload/email; refreshing/revoking sessions safely; preserving historical prices after catalog edits; serializing identity/deletion/checkout races; safe Google linking; receipt capability protection; and the maintenance tradeoff behind recorded Admin presentation.

Honest boundaries: no public Admin demo or credentials, no payment-provider integration claim, no analytics/settings UI, API-only product archive/availability, configurable unverified direct signup, and outstanding external-provider/operational/cross-engine checks. An interactive isolated Admin demo is a potential V1.1 project, not part of this release.

Do not describe the project as fully production-accepted or security-certified. Use “implemented and locally tested, with documented staging conditions.” Media publication, commits and deployment require a separate approved step.
