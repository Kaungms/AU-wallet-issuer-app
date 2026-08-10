# AU Wallet Issuer App

React/Vite issuer workspace for pre-issuance student and academic review.
Credential generation, signing, issuance, DID operations, and wallet delivery
are intentionally outside this repository's current integration.

## Local development

Create an ignored `.env.local` with the NestJS server's base URL:

```dotenv
VITE_API_BASE_URL=http://<backend-host>:3000
```

Then run:

```sh
npm install
npm run dev -- --port 5173 --strictPort
```

The NestJS server must listen on an address reachable by the browser and allow
the frontend origin through CORS.

## Issuer API

The API functions are exported from `src/api/issuerApi.js`. During the current
controlled development test, requests do not send an `Authorization` header;
temporary access is controlled by NestJS. Dashboard, student search, academic
review/preview, program options, graduating-student search, and wallet
eligibility are connected. The response schemas and database field mappings are
documented in `docs/issuer-pre-issuance-api-contract.md`.

Registrar-facing screens display the degree, major, and optional concentration;
the synthetic `programCode` remains an internal API filter. An unverified wallet
is shown as a warning but does not block pre-issuance student selection. Final
credential issuance and wallet delivery are not implemented in this frontend.

## Verification

```sh
npm test
npm run lint
npm run build
```
