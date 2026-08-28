# Configuration

Copy `.env.example` to `.env.local` and replace every placeholder before starting the bot.
`.env.local` is ignored by Git.

## AI provider

The bot supports OpenAI-compatible endpoints. To use Groq, set `GROQ_API_KEY`; it takes
precedence over `OPENAI_API_KEY`.

- `OPENAI_API_KEY` — API key used by `OpenAIModel`.
- `OPENAI_MODEL` — Chat model name. Defaults to `gpt-4o-mini`.
- `GROQ_API_KEY` — Groq API key.
- `GROQ_MODEL` — Groq model name. Defaults to `openai/gpt-oss-120b`.
- `OPENAI_BASE_URL` — Optional custom OpenAI-compatible endpoint.

For Groq, the application automatically uses
`https://api.groq.com/openai/v1`. Do not set `OPENAI_BASE_URL` unless using another
OpenAI-compatible provider.

## Teams and Bot Framework

- `BOT_ID` — Microsoft Entra application ID for the Teams bot.
- `BOT_PASSWORD` — Bot client secret.
- `BOT_TENANT_ID` — Microsoft Entra tenant ID.
- `PORT` — HTTP port. Defaults to `3978`.

The bot messaging endpoint is:

```text
https://your-host.example.com/api/messages
```

Configure this URL in the Bot Framework registration and Teams app manifest.

## Microsoft Graph and SharePoint

- `GRAPH_TENANT_ID` — Tenant containing the Graph app registration.
- `GRAPH_CLIENT_ID` — Client ID of the Graph app registration.
- `GRAPH_CLIENT_SECRET` — Client secret for the Graph app registration.
- `SHAREPOINT_SITE_ID` — SharePoint site ID used in the Graph Search KQL filter.

The Graph app registration needs the `Sites.Read.All` application permission with administrator
consent. The search code requests the
`https://graph.microsoft.com/.default` scope.

The site ID can be obtained from the Microsoft Graph site resource for the target SharePoint
site. The example value in `.env.example` is deliberately invalid and must be replaced.

## Ticketing

- `TICKETING_BASE_URL` — Base URL used to build mock ticket links.

Ticket creation is simulated locally. No webhook request is made until
`src/services/ticketService.ts` is replaced with the real integration.

## Configuration checks

The application fails fast when both `GROQ_API_KEY` and `OPENAI_API_KEY` are missing.
`GraphService` validates the Graph and SharePoint variables when it is constructed. This
prevents the bot from running with incomplete AI or retrieval configuration.
