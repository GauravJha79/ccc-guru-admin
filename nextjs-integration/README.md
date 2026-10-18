# CCCGuru.in — Next.js Hygraph Blog Frontend Integration Guide

This directory contains the production-ready Next.js files and architecture contracts to connect **CCCGuru.in** (`https://www.cccguru.in/`) to our new **Hygraph Headless CMS**.

---

## 1. File Structure Overview

Copy these files into your Next.js application:

```
your-nextjs-app/
├── lib/
│   └── hygraph.ts                    # Hygraph GraphQL client with ISR cache tags
├── app/
│   ├── [locale]/
│   │   └── blogs/
│   │       └── [slug]/
│   │           └── page.tsx          # Dynamic bilingual article route with SEO & hreflang
│   └── api/
│       └── revalidate/
│           └── route.ts              # Webhook receiver for instant cache invalidation
└── next.config.js                    # 301 legacy redirects & image domain configuration
```

---

## 2. Environment Variables (.env.local)

Add these keys to your Next.js project's `.env.local`:

```env
# Hygraph Content API (Read)
NEXT_PUBLIC_HYGRAPH_CONTENT_API="https://api-ap-south-1.hygraph.com/v2/cmuf38sab01kc06w5gj3n7eyk/master"

# Optional Auth Token (if Content API is private)
HYGRAPH_AUTH_TOKEN=""

# Public Website Canonical Origin
NEXT_PUBLIC_SITE_URL="https://www.cccguru.in"

# Secret token shared with Hygraph Webhooks
HYGRAPH_WEBHOOK_SECRET="cccguru_secure_webhook_secret_2026"
```

---

## 3. SEO & Technical Architecture Highlights

### Independent SEO URLs & Canonical Tags
- **English Article:** `https://www.cccguru.in/en/blogs/ccc-exam-syllabus-faqs-guide-2026`
- **Hindi Article:** `https://www.cccguru.in/hi/blogs/ccc-exam-syllabus-faqs-guide-2026-hi`

### Reciprocal Hreflang Tags
- Automatically queries the counterpart article in the same `translationGroupId`.
- Emits reciprocal `hreflang="en"`, `hreflang="hi"`, and `hreflang="x-default"`.
- **Draft Safety:** If the Hindi counterpart is still in `DRAFT` or unpublished, the English page **omits** the `hi` hreflang tag to prevent search engine 404 indexing errors.

### Legacy 301 Redirects
- Automatically redirects legacy single-slug URLs:
  - `/blogs/:slug` $\rightarrow$ `/en/blogs/:slug` (HTTP 301 Permanent).

### Instant On-Demand Cache Revalidation (ISR)
- Hygraph triggers the `/api/revalidate` webhook whenever a post is published, updated, or unpublished.
- Next.js invalidates `revalidateTag('blogs')`, `revalidateTag('post-[slug]')`, and updates paths in real-time without redeploying.

---

## 4. Configuring the Webhook in Hygraph

1. Open your Hygraph Dashboard (`cmuf38sab01kc06w5gj3n7eyk`).
2. Navigate to **Project Settings** $\rightarrow$ **Webhooks** $\rightarrow$ **Add Webhook**.
3. Set the Webhook URL: `https://www.cccguru.in/api/revalidate`.
4. Add Header: `x-hygraph-secret: cccguru_secure_webhook_secret_2026`.
5. Select Trigger Models: `Post`.
6. Select Trigger Actions: `Publish`, `Unpublish`, `Delete`, `Update`.
7. Save and enable the webhook.
