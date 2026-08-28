import path from 'node:path';

import { MemoryStorage } from 'botbuilder';
import { config } from 'dotenv';
import {
  ActionPlanner,
  Application,
  OpenAIModel,
  PromptManager,
  TurnState,
} from '@microsoft/teams-ai';

config({ path: path.resolve(process.cwd(), '.env.local') });

const openAiApiKey = process.env.OPENAI_API_KEY;

if (!openAiApiKey) {
  throw new Error(
    'Missing OPENAI_API_KEY. Set it in your environment before starting the bot.',
  );
}

const model = new OpenAIModel({
  apiKey: openAiApiKey,
  defaultModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  useSystemMessages: true,
});

const prompts = new PromptManager({
  promptsFolder: path.join(__dirname, '../src/prompts'),
});

const planner = new ActionPlanner({
  model,
  prompts,
  defaultPrompt: 'default',
});

export const app = new Application<TurnState>({
  storage: new MemoryStorage(),
  ai: {
    planner,
  },
});

app.message('/reset', async (_context, state) => {
  state.deleteConversationState();
});
