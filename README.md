# AU Wallet Issuer App

React/Vite issuer portal backed by a separately deployed NestJS API.

## Local development

Create an ignored `.env.local` with the NestJS server's base URL:

```dotenv
VITE_API_BASE_URL=http://<backend-host>:3000
```

For holder email notifications, configure the Vercel server function with:

```dotenv
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=credentials@your-verified-domain.example
```

The student response must include `email`, `holderEmail`, or `contactEmail`.
The key must never be placed in a `VITE_` variable or frontend source.

Then run the frontend on the backend's allowlisted development origin:

```sh
npm install
npm run dev
```

The dev script intentionally uses `http://localhost:5173` with `strictPort` so
Vite fails clearly instead of silently switching to a port rejected by the
backend's CORS policy.

The NestJS server must listen on an address reachable by the browser and allow
the frontend origin through CORS.

## Issuer API

The API functions are exported from `src/api/issuerApi.js`. Login and issuer
requests share `VITE_API_BASE_URL`. Issuer requests send the stored access token
as a Bearer token. Backend authorization remains responsible for protecting
student records and issuance actions.

The response schemas and database field mappings are documented in
`docs/issuer-pre-issuance-api-contract.md`.

## Deploy to Vercel

1. Deploy the NestJS backend to a public HTTP or HTTPS address reachable from
   Vercel. This repository deploys the frontend and a small API proxy, not NestJS.
2. Import this Git repository into Vercel. Use the repository root directory.
   `vercel.json` selects Vite, `npm ci`, `npm run build`, and `dist` automatically.
   Node.js 24 is selected by `package.json` (use `nvm use` locally).
3. In **Project Settings → Environment Variables**, add:

   ```dotenv
   VITE_API_BASE_URL=https://your-backend.example.com
   ```

   Replace the example with the actual API base URL, including a path prefix if
   your backend uses one. Enable it for Production and Preview as needed.
   `VITE_` values are public and embedded at build time; do not put passwords,
   database credentials, or signing keys in them. Redeploy after changing them.

4. Ensure AWS networking allows Vercel to reach the configured backend port and
   NestJS listens on a reachable interface. Deployed browsers use the same-origin
   `/api/backend` proxy; local development still calls the backend directly and
   needs `http://localhost:5173` in the backend CORS allowlist.
5. Deploy. Sign in, open the dashboard and student list, then reload a bookmarked
   `/#/issued-credentials` route to verify the deployed app and backend together.

All production builds use `/api/backend` automatically, without depending on
the `VERCEL` system environment variable. Plain `vite preview` serves only static
files; use a Vercel deployment to exercise the server-side proxy. The Node function in
`api/proxy.js` reads `VITE_API_BASE_URL` at runtime, forwards login bodies and
Bearer authorization, and preserves backend response status codes. API routing
runs before the SPA fallback. Keep this variable enabled in each deployment
environment (Production/Preview). Local Vite development uses the API directly.

The browser-to-Vercel connection uses HTTPS, allowing an HTTP upstream without
browser mixed-content errors. The Vercel-to-HTTP-backend connection remains
unencrypted; HTTPS upstream encrypts that hop too. Proxy responses are not cached.

Troubleshooting:

- Build URL error: set a public HTTP or HTTPS `VITE_API_BASE_URL` and redeploy.
- API 502/504: check the AWS public address, backend port, security group, firewall,
  and NestJS service availability. Private AWS IPs are not publicly reachable.
- API 401/403: check the registrar session and backend authorization.
- Requests still go directly to an HTTP IP: deploy the latest commit to Production,
  confirm the domain points to that deployment, and hard-refresh. An old browser
  tab can keep the previous JavaScript bundle until it reloads.

Configuration follows [Vercel’s Vite deployment documentation](https://vercel.com/docs/frameworks/frontend/vite).

## Verification

```sh
npm test
npm run lint
npm run build
```
