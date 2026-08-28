import * as restify from 'restify';

import { TeamsAdapter } from '@microsoft/teams-ai';
import { app } from './app';

function configuredValue(primaryName: string, fallbackName: string): string | undefined {
  const primaryValue = process.env[primaryName]?.trim();

  if (primaryValue && !primaryValue.startsWith('your-')) {
    return primaryValue;
  }

  return process.env[fallbackName]?.trim();
}

const adapter = new TeamsAdapter({
  MicrosoftAppId: configuredValue('BOT_ID', 'CLIENT_ID'),
  MicrosoftAppPassword: configuredValue('BOT_PASSWORD', 'CLIENT_SECRET'),
  MicrosoftAppTenantId: configuredValue('BOT_TENANT_ID', 'TENANT_ID'),
});

adapter.onTurnError = async (context, error) => {
  console.error('[onTurnError]', error);
  await context.sendActivity(
    'The bot encountered an error while processing your request.',
  );
};

const server = restify.createServer();

server.use(restify.plugins.bodyParser());

server.get('/health', (_request, response, next) => {
  response.send({ status: 'ok' });
  return next();
});

server.post('/api/messages', async (request, response) => {
  console.log(
    `[botRequest] Received ${request.body?.type ?? 'unknown'} activity`,
  );

  try {
    await adapter.process(request, response as any, async (context) => {
      await app.run(context);
    });
  } catch (error) {
    console.error('[botRequest] Failed to process activity', error);

    if (!response.headersSent) {
      response.send(500, { error: 'Failed to process bot activity.' });
    }
  }
});

const port = Number(process.env.PORT ?? 3978);

server.listen(port, () => {
  console.log(`${server.name} listening on ${server.url}`);
});
