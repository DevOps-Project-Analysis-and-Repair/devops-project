import { Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';
import { client } from './client';
import { prompt_instructions } from './prompt';

const serviceName = 'llm-service';

const logger = new Logger({ serviceName });
const app = new Router({ logger });

app.post(`/${serviceName}/analyze`, async ({ req }) => {
  console.log(req);
  if (!req.body) return;
  const code = 'x';
  const response = await client.responses.create({
    model: 'gpt-5.2',
    instructions: prompt_instructions,
    input: code,
  });

  return { ok: true };
});

export const handler = async (event: unknown, context: Context) => app.resolve(event, context);
