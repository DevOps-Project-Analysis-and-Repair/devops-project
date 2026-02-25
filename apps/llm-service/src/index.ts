import { Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';
import { analyzeCode } from './client';

const serviceName = 'llm-service';

const logger = new Logger({ serviceName });
const app = new Router({ logger });

app.post(`/${serviceName}/analyze`, async ({ req }) => {
  const fileContent: string = await req.text();
  console.log('found endpoint xyz');
  if (!fileContent) return { ok: false, message: 'No file provided' };

  const outputCode = await analyzeCode(fileContent);
  console.log('did AI');

  return { ok: true, code: outputCode };
});

export const handler = async (event: unknown, context: Context) => app.resolve(event, context);
