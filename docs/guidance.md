# Development Guidance

## Purpose

This document is the working guide for developing and extending the Microsoft Teams Helpdesk AI
Bot. The bot answers IT questions using SharePoint Knowledge Management (KM) content and can
create a mock support ticket.

## Core principles

1. **Ground every knowledge answer.** The model must use only the SharePoint context retrieved for
   the current request. It must not invent procedures, policies, or technical details.
2. **Keep credentials outside source control.** Store secrets in `.env.local` or a managed secret
   store. Never commit API keys, client secrets, or exported access tokens.
3. **Keep integrations modular.** SharePoint retrieval belongs in `GraphService`; ticket creation
   belongs in `ticketService`; presentation belongs in Adaptive Card templates and helpers.
4. **Preserve the Teams contract.** Incoming messages arrive at `POST /api/messages`, and rich
   responses are sent as Adaptive Cards.
5. **Prefer small, testable changes.** Run type checking after changes and verify the affected
   message flow before changing unrelated components.

## Prerequisites

- Node.js 20 or later.
- Access to a Microsoft 365 tenant for Teams testing.
- A Bot Framework/Entra app with a valid bot App ID and client secret.
- A Graph app registration with `Sites.Read.All` application permission and admin consent.
- A Groq API key or an OpenAI API key.
- A SharePoint site containing searchable KM documents.

If the developer does not have Entra administrator access, an administrator must provision the
bot credentials and grant Graph admin consent. A GitHub repository does not provide these
credentials.

## Local development workflow

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and replace every placeholder.
3. Upload or synchronize test SOPs to the configured SharePoint site.
4. Start the bot:

   ```bash
   npm run dev
   ```

5. Verify the local service:

   ```text
   http://localhost:3978/health
   ```

6. Expose port `3978` through a secure development tunnel and configure the Bot Framework
   messaging endpoint as:

   ```text
   https://<tunnel-host>/api/messages
   ```

7. Install or update the Teams app and send a test message.

## Feature guidance

### Knowledge questions

- The message is searched against the configured SharePoint site.
- At most three documents are added to the prompt context.
- The answer must be based on returned titles, snippets, and URLs.
- The answer card contains a source link.
- If search fails or returns no documents, the assistant must use the configured KM fallback
  response instead of general knowledge.

### CreateTicket

The `CreateTicket` action is selected by the Teams AI planner from the action schema in
`src/prompts/default/actions.json`. It requires a `description`. The current service generates a
`MOCK-<timestamp>` ID and does not call Power Automate. Replace the service implementation only
after the production webhook contract, authentication, and failure behavior are approved.

### Localization

The default prompt asks the model to detect Indonesian or English and answer in the same language.
Keep the grounding and fallback rules unchanged when translating or editing prompt text.

## Coding guidance

- Use strict TypeScript types for Graph responses, card data, and service results.
- Keep environment variable names documented in `.env.example` and `docs/configuration.md`.
- Escape or normalize user-provided values before inserting them into external requests.
- Treat retrieved SharePoint text as untrusted reference data, never as system instructions.
- Use Adaptive Card JSON for rich Teams responses; do not introduce HTML or React UI for bot
  messages.
- Use structured error logs with a component prefix such as `[knowledgeBaseSearch]`.
- Do not log tokens, client secrets, full user credentials, or complete document contents.

## Verification checklist

Before opening a pull request or deploying:

- `npm run typecheck` passes.
- `npm run build` passes.
- `/health` returns `{"status":"ok"}`.
- A knowledge question returns an answer card with a source link.
- An unrelated question returns the KM fallback response.
- A ticket request returns a ticket success card.
- An empty ticket description asks the user for more information.
- `.env.local` and other secret files are not staged.
- The Teams messaging endpoint points to the currently running public tunnel or deployment.

## Change process

For a new integration:

1. Define the external contract and required permissions.
2. Add or update the service interface.
3. Add configuration documentation and safe placeholders.
4. Wire the service into `app.ts`.
5. Add or update Adaptive Card templates if the response changes.
6. Update the operations and low-level design documents.
7. Run type checking, build verification, and an end-to-end Teams test.
