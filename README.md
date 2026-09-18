# AU Wallet Issuer App

React/Vite issuer portal backed by a separately deployed NestJS API.

## Local development

Create an ignored `.env.local` with the NestJS server's base URL:

```dotenv   
VITE_API_BASE_URL=http://<backend-host>:3000
```

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

1. Deploy the NestJS backend to a public HTTPS address accessible from users’
   browsers. This repository deploys the frontend only.
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
4. Configure the backend CORS allowlist with your exact Vercel production origin
   (for example `https://your-project.vercel.app`) and any preview/custom domains
   you use. Allow the API's methods, OPTIONS preflight, and the `Authorization`
   and `Content-Type` request headers. Keep `http://localhost:5173` for local use.
5. Deploy. Sign in, open the dashboard and student list, then reload a bookmarked
   `/#/issued-credentials` route to verify the deployed app and backend together.

Vercel builds accept HTTP and HTTPS API URLs, and reject missing, invalid,
and common local/private API addresses. HTTP is accepted for building, but
browsers block direct HTTP API requests from an HTTPS Vercel page as mixed
content. For working login and API calls, use an HTTPS backend or an HTTPS
reverse proxy in front of the HTTP backend.
The Vercel SPA rewrite serves the app for navigation requests; it does not proxy
or host the NestJS backend. A successful frontend build does not verify backend
reachability or authentication.

Troubleshooting:

- A failed build mentioning `VITE_API_BASE_URL`: set a public HTTP or HTTPS backend URL
  in the matching Vercel environment and redeploy.
- Browser network/CORS errors: check the backend HTTPS certificate, reachability,
  and allowed frontend origin. Localhost points to the visitor's own computer.
- API 401/403 responses: check the registrar account and backend authorization.

Configuration follows [Vercel’s Vite deployment documentation](https://vercel.com/docs/frameworks/frontend/vite).

## Verification

```sh
npm test
npm run lint
npm run build
```
