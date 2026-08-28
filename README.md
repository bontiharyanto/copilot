# Microsoft Teams Helpdesk AI Bot

This project is a Microsoft Teams helpdesk bot that answers IT questions from a SharePoint
Knowledge Management repository and can create support tickets through a mock Power Automate
workflow.

## Current capabilities

- Searches SharePoint through Microsoft Graph `/search/query`.
- Limits results to the configured SharePoint site.
- Injects the top three document snippets into the AI prompt.
- Enforces grounded answers in English or Indonesian.
- Returns answers as Adaptive Cards with a SharePoint citation link.
- Detects the `CreateTicket` intent.
- Returns a ticket success card containing the ticket ID, status, and link.

## Requirements

- Node.js 20 or later.
- A Microsoft Entra app registration with Microsoft Graph application permission
  `Sites.Read.All` and administrator consent.
- An OpenAI or Groq API key.
- A Teams/Bot Framework app registration for production or Teams testing.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Set the values in `.env.local`. See [configuration.md](docs/configuration.md) for details.

4. Start the development server:

   ```bash
   npm run dev
   ```

The bot listens on port `3978` by default. The Bot Framework messaging endpoint is
`POST /api/messages`, and `GET /health` can be used as a health check.

## Available scripts

- `npm run dev` — Run the bot with the TypeScript watcher.
- `npm run typecheck` — Validate TypeScript without emitting files.
- `npm run build` — Compile TypeScript into `dist/`.
- `npm start` — Run the compiled bot.

## Request flow

1. Teams sends a message to `/api/messages`.
2. `src/app.ts` intercepts the message with `app.activity()`.
3. `GraphService` searches the configured SharePoint site.
4. Search results are added to the system prompt as authoritative context.
5. The AI either returns a grounded answer or detects `CreateTicket`.
6. The bot sends an Adaptive Card response.

## Project structure

- `src/index.ts` — Restify server and Teams adapter.
- `src/app.ts` — Teams AI application, prompt wiring, and intent handlers.
- `src/services/graphService.ts` — MSAL authentication and SharePoint search.
- `src/services/ticketService.ts` — Mock ticket creation workflow.
- `src/cards/` — Adaptive Card JSON templates.
- `src/utils/cardHelper.ts` — Dynamic Adaptive Card population helpers.
- `src/prompts/default/` — System prompt and `CreateTicket` action schema.
- `docs/knowledge-base/` — Example SOP documents for SharePoint ingestion/testing.

## Knowledge Management documents

The example SOPs in `docs/knowledge-base/` are local source documents. Upload or synchronize
them to the SharePoint site represented by `SHAREPOINT_SITE_ID` before testing RAG responses.
They are not automatically indexed by this application.

See [architecture.md](docs/architecture.md) for the component design and
[configuration.md](docs/configuration.md) for identity and permission setup.

## Important notes

- Never commit `.env.local`, client secrets, or API keys.
- Ticket creation is currently mocked; replace `createTicket()` with the real Power Automate
  webhook integration before production use.
- `@microsoft/teams-ai` v1 is deprecated upstream. This project currently uses it because it is
  the requested library and should be migrated to the current Teams SDK in a future upgrade.
