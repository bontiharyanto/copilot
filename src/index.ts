import * as restify from 'restify';

import { TeamsAdapter } from '@microsoft/teams-ai';
import { app } from './app';

const adapter = new TeamsAdapter({
  MicrosoftAppId: process.env.BOT_ID,
  MicrosoftAppPassword: process.env.BOT_PASSWORD,
  MicrosoftAppTenantId: process.env.BOT_TENANT_ID,
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
  await adapter.process(request, response as any, async (context) => {
    await app.run(context);
  });
});

const port = Number(process.env.PORT ?? 3978);

server.listen(port, () => {
  console.log(`${server.name} listening on ${server.url}`);
});
