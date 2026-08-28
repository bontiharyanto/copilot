# Operations Runbook

## Service summary

The bot is a Node.js process that exposes a Restify server on port `3978` by default. It accepts
Bot Framework activities at `POST /api/messages` and exposes `GET /health` for a basic liveness
check.

The service depends on:

- Microsoft Bot Framework authentication for Teams activities.
- Groq or OpenAI for response generation.
- Microsoft Graph application authentication for SharePoint search.
- A reachable public HTTPS endpoint when tested from Teams.

## Start and stop

### Start locally

```bash
npm install
npm run dev
```

Expected startup output includes:

```text
restify listening on http://[::]:3978
```

### Run the compiled application

```bash
npm run build
npm start
```

### Stop locally

Press `Ctrl+C` in the terminal running the process.

## Health check

Run:

```bash
curl http://localhost:3978/health
```

Expected response:

```json
{"status":"ok"}
```

This endpoint confirms that the HTTP process is listening. It does not prove that Teams
authentication, Graph, SharePoint, or the LLM provider is available.

## Tunnel and Teams endpoint

For local Teams testing, expose port `3978` through Dev Tunnels or another approved HTTPS tunnel.
Configure the Bot Framework messaging endpoint with the exact URL:

```text
https://<tunnel-host>/api/messages
```

Keep `npm run dev` and the tunnel process running at the same time. If the tunnel host changes,
update the bot messaging endpoint and reinstall or refresh the Teams app configuration as required.

## Observability

The current application logs:

- Service startup URL.
- The activity type received at `/api/messages`.
- Bot processing failures.
- SharePoint search failures.
- Adapter turn errors.

Logs must not contain API keys, client secrets, bearer tokens, or unnecessary full SharePoint
content. For production, replace console logging with structured logs containing a correlation ID,
timestamp, severity, component, and duration.

## Incident triage

### The process does not start

1. Check the Node.js version.
2. Run `npm install`.
3. Run `npm run typecheck` to identify source errors.
4. Check that the AI variables are configured.
5. Check that all Graph variables are configured; `GraphService` validates them during startup.
6. Confirm that `.env.local` is loaded from the project root.

### Teams returns 401 or `Invalid AppId passed on token`

The App ID in the incoming Teams token must match `BOT_ID`. The client secret must belong to the
same Entra app registration. Do not use a secret from a different `CLIENT_ID`.

Check:

1. The bot App ID in the Teams/Bot registration.
2. `BOT_ID` in `.env.local`.
3. `BOT_PASSWORD` is the client secret **Value**, not the Secret ID.
4. `BOT_TENANT_ID` is the Directory (tenant) ID.
5. The Teams app and Bot Framework endpoint refer to the same bot registration.

If the developer cannot manage Entra applications, an administrator must create or provide the
matching secret.

### Teams receives no response

1. Confirm the server is running.
2. Confirm `/health` is reachable locally.
3. Confirm the tunnel is connected to port `3978`.
4. Confirm the messaging endpoint ends in `/api/messages`.
5. Check for `[botRequest] Received message activity`.
6. Check for authentication errors.
7. Check the LLM and Graph errors.
8. Restart the bot after editing `.env.local`.

An authentication error means the request is rejected before the AI or SharePoint logic runs.

### Graph or SharePoint search fails

Check:

- `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, and `GRAPH_CLIENT_SECRET` belong to a valid app.
- The Graph app has `Sites.Read.All` as an **application** permission.
- Admin consent has been granted.
- `SHAREPOINT_SITE_ID` is the GUID of the intended site.
- The target documents are indexed and searchable.
- The app secret has not expired.

The bot will preserve an empty result and instruct the model not to answer from general knowledge.

### LLM authentication fails

For Groq, configure `GROQ_API_KEY` and `GROQ_MODEL`. A Groq key begins with `gsk_` and must not
be placed in `OPENAI_API_KEY` unless a compatible endpoint is also configured. The application
automatically uses `https://api.groq.com/openai/v1` when `GROQ_API_KEY` is set.

### Ticket link is not usable

Ticket creation is currently mocked. Set `TICKETING_BASE_URL` to a suitable test URL, or replace
`src/services/ticketService.ts` with an approved Power Automate or service-management integration.

## Routine maintenance

- Rotate bot, Graph, and LLM secrets before expiry.
- Review Graph permissions and remove unused access.
- Keep the Teams app manifest and messaging endpoint synchronized.
- Confirm SharePoint indexing after KM content changes.
- Review error rates and response latency.
- Replace `MemoryStorage` before running multiple production instances.
- Plan migration from the deprecated Teams AI Library v1.

## Recovery and rollback

1. Stop the affected process or deployment.
2. Restore the last known-good source version and configuration.
3. Never restore secrets from Git history; retrieve them from the approved secret store.
4. Run `npm run typecheck` and `npm run build`.
5. Start the service and verify `/health`.
6. Verify the tunnel or production endpoint.
7. Send a knowledge question and a ticket request in Teams.

## Security response

If a secret is committed or exposed:

1. Revoke or rotate it immediately in the provider that issued it.
2. Replace the value in the approved secret store.
3. Check access logs for suspicious use.
4. Remove the secret from the working tree and Git history through the repository owner’s approved
   process.
5. Do not paste the replacement secret into tickets, chat, or documentation.
