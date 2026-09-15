This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Production builds use `/api` for all browser API requests, including admin auth
and guest order tracking. The rewrite in `next.config.ts` proxies `/api/:path*`
to `https://orderly-production-1ac4.up.railway.app/api/:path*`, preserving one
`/api` prefix. Authenticated requests continue to include cookie credentials.

Set Vercel's `NEXT_PUBLIC_API_BASE_URL` to `/api` (or remove it); production
builds enforce `/api` even if an old Railway URL remains configured. A new build
and deployment are needed to apply these code changes. No Railway settings need
to change for this frontend routing change.

Server-rendered menu requests use the absolute Railway API URL because server
`fetch` requires an absolute URL. Browser requests use the same-origin proxy.

For `pnpm dev`, keep `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api` in
`.env.local`; this is also the development fallback when the variable is absent.
Local production builds (`pnpm build` / `pnpm start`) use the Railway proxy.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
