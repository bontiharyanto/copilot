# Configuration Guide

## 1. Configuration file

Create the local file from the checked-in template:

```bash
cp .env.example .env.local
```

Replace every `your-...` or zero-GUID placeholder before starting the application. `.env.local`
is ignored by Git and must never be committed.

The application loads `.env.local` from the project root. Restart `npm run dev` after changing
environment values.

## 2. Environment variables

### AI provider

The application supports OpenAI-compatible endpoints. Groq takes precedence whenever
`GROQ_API_KEY` is configured.

- `GROQ_API_KEY`: Groq API key.
- `GROQ_MODEL`: Groq model name. The default is `openai/gpt-oss-120b`.
- `OPENAI_API_KEY`: OpenAI API key used when `GROQ_API_KEY` is not set.
- `OPENAI_MODEL`: OpenAI model name. The default is `gpt-4o-mini`.
- `OPENAI_BASE_URL`: Optional custom endpoint used only for the OpenAI-compatible fallback.

When using Groq, the application automatically uses:

```text
https://api.groq.com/openai/v1
```

A Groq key normally starts with `gsk_`. Put it in `GROQ_API_KEY`, not `OPENAI_API_KEY`.

### Teams and Bot Framework

- `BOT_ID`: Microsoft App ID of the Bot Framework/Azure Bot registration.
- `BOT_PASSWORD`: Client secret **Value** belonging to `BOT_ID`.
- `BOT_TENANT_ID`: Directory (tenant) ID of the bot application.
- `PORT`: HTTP port; defaults to `3978`.

The App ID and client secret must belong to the same Entra app registration. The current code
supports these compatibility fallbacks when the `BOT_*` variables are missing or placeholders:

- `CLIENT_ID` → `BOT_ID`
- `CLIENT_SECRET` → `BOT_PASSWORD`
- `TENANT_ID` → `BOT_TENANT_ID`

Do not rely on the fallbacks when the Teams token identifies a different bot App ID. A mismatch
causes `401 Invalid AppId passed on token`.

For local Teams testing, configure the public HTTPS Bot Framework messaging endpoint:

```text
https://<tunnel-host>/api/messages
```

The tunnel must forward to local port `3978`. For production, use a stable HTTPS hostname.

### Microsoft Graph and SharePoint

- `GRAPH_TENANT_ID`: Tenant containing the Graph app registration.
- `GRAPH_CLIENT_ID`: Client ID of the Graph app registration.
- `GRAPH_CLIENT_SECRET`: Client secret Value for that Graph app.
- `SHAREPOINT_SITE_ID`: GUID of the SharePoint site to search.

The Graph app requires the `Sites.Read.All` **application** permission with administrator consent.
The code uses the client-credentials flow and requests:

```text
https://graph.microsoft.com/.default
```

For a SharePoint URL such as `https://contoso.sharepoint.com/sites/Helpdesk`, the site ID can be
retrieved from:

```text
https://contoso.sharepoint.com/sites/Helpdesk/_api/site/id
```

Copy the GUID between the `Edm.Guid` tag and `</d:Id>`. The Graph app must also be able to search
the site and its documents must be indexed.

The bot and Graph app can be the same Entra app only if the required Graph permission has been
assigned and consented. Otherwise use separate credentials.

### Ticketing

- `TICKETING_BASE_URL`: Base URL used to construct mock ticket links.

Ticket creation is currently simulated by `src/services/ticketService.ts`. No Power Automate,
ServiceNow, or Jira request is made.

## 3. Example structure

Use this structure without putting real secrets into documentation:

```env
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-120b
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=

BOT_ID=your-microsoft-bot-app-id
BOT_PASSWORD=your-microsoft-bot-password
BOT_TENANT_ID=your-microsoft-entra-tenant-id

GRAPH_TENANT_ID=your-microsoft-entra-tenant-id
GRAPH_CLIENT_ID=your-graph-app-client-id
GRAPH_CLIENT_SECRET=your-graph-app-client-secret
SHAREPOINT_SITE_ID=00000000-0000-0000-0000-000000000000

TICKETING_BASE_URL=https://example.invalid/tickets
PORT=3978
```

## 4. Configuration ownership

If the developer does not have Entra administrator access, request the following from the tenant
administrator:

- The bot App ID and matching client secret.
- The Directory (tenant) ID.
- A Graph app identity with `Sites.Read.All` application permission and admin consent.
- Confirmation that the Bot Framework messaging endpoint is configured.

Secrets must be shared through an approved secret manager or secure channel. Never paste them into
GitHub, source files, issue trackers, or chat.

## 5. Validation

After configuration:

```bash
npm run typecheck
npm run build
npm run dev
curl http://localhost:3978/health
```

Expected health response:

```json
{"status":"ok"}
```

The health response only verifies that the process is listening. Test Teams authentication,
Graph retrieval, and LLM generation separately.
