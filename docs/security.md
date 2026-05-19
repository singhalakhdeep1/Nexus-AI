# NexusFlow — Security Writeup

> OWASP Top 10 (2021) checklist + mitigation log for NexusFlow.

## OWASP A01 — Broken Access Control

| Control                  | Implementation                                                              |
| ------------------------ | --------------------------------------------------------------------------- |
| Row-Level Security       | All Supabase tables have `auth.uid()` RLS policies — no query bypasses them |
| tRPC authorization       | `protectedProcedure` middleware enforces session on every mutation          |
| Project membership check | Every task mutation verifies `project_members` row before writing           |
| Role hierarchy           | `owner > admin > member > viewer` enforced at DB + API layer                |

## OWASP A02 — Cryptographic Failures

| Control            | Implementation                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- |
| TLS                | Enforced via `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` |
| Secrets management | All secrets in environment variables; never committed; `.env*` in `.gitignore`         |
| Passwords          | Delegated to Supabase Auth (bcrypt, salted, NIST 800-63B compliant)                    |
| API tokens         | Short-lived Supabase JWTs (1hr) + refresh token rotation                               |

## OWASP A03 — Injection

| Control          | Implementation                                                              |
| ---------------- | --------------------------------------------------------------------------- |
| SQL injection    | Drizzle ORM + Supabase client use parameterized queries exclusively         |
| XSS              | CSP blocks inline scripts; React escapes JSX by default                     |
| Prompt injection | AI tool inputs validated with Zod before execution; system prompt sandboxed |

## OWASP A04 — Insecure Design

| Control          | Implementation                                                              |
| ---------------- | --------------------------------------------------------------------------- |
| Rate limiting    | Upstash Ratelimit: `slidingWindow(100, "1m")` on all `/api/*` routes        |
| AI rate limiting | Separate limit: 30 req/min per user on AI assistant                         |
| Tenant isolation | Organization ID propagated through all queries; cross-org access impossible |

## OWASP A05 — Security Misconfiguration

| Control                  | Implementation                                             |
| ------------------------ | ---------------------------------------------------------- |
| CSP                      | Full Content-Security-Policy header (see `next.config.ts`) |
| CORS                     | Next.js default — same-origin only for API routes          |
| `X-Frame-Options`        | `DENY` — prevents clickjacking                             |
| `X-Content-Type-Options` | `nosniff`                                                  |
| `Permissions-Policy`     | Camera, mic, geolocation disabled                          |

## OWASP A06 — Vulnerable Components

| Control          | Implementation                                                      |
| ---------------- | ------------------------------------------------------------------- |
| Dependency audit | `pnpm audit` runs in CI on every push                               |
| Dependabot       | `.github/dependabot.yml` — weekly patch updates                     |
| Lock file        | `pnpm-lock.yaml` committed and verified in CI (`--frozen-lockfile`) |

## OWASP A07 — Auth Failures

| Control            | Implementation                                                  |
| ------------------ | --------------------------------------------------------------- |
| Session management | Supabase SSR client (`@supabase/ssr`) — `httpOnly` cookies      |
| PKCE               | OAuth flows use PKCE (Supabase default)                         |
| Brute force        | Supabase Auth enforces rate limits on login attempts            |
| Logout             | `supabase.auth.signOut()` invalidates refresh token server-side |

## OWASP A08 — Software and Data Integrity

| Control         | Implementation                                                                           |
| --------------- | ---------------------------------------------------------------------------------------- |
| CI verification | GitHub Actions runs `pnpm audit`, typecheck, and unit tests before any deploy            |
| Stripe webhooks | Signature verified with `stripe.webhooks.constructEvent()` — rejects unverified payloads |
| Sentry          | Real-time error alerting; integrity anomalies surfaced in <1min                          |

## OWASP A09 — Logging Failures

| Control                   | Implementation                                                                   |
| ------------------------- | -------------------------------------------------------------------------------- |
| Error tracking            | Sentry captures all server errors with user context                              |
| Audit log                 | Critical mutations (role change, member add/remove) logged to `audit_logs` table |
| No sensitive data in logs | Zod strips unknown fields; PII never logged                                      |

## OWASP A10 — SSRF

| Control           | Implementation                                                           |
| ----------------- | ------------------------------------------------------------------------ |
| External requests | Only made to allowlisted services (OpenAI, Supabase, Stripe, Liveblocks) |
| URL validation    | No user-supplied URLs are fetched server-side                            |
| Image hostnames   | Allowlisted in `next.config.ts` `images.remotePatterns`                  |

---

## Responsible Disclosure

Found a vulnerability? Email security@nexusflow.app — we aim to respond within 24 hours.
