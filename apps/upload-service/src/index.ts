import { APIGatewayEvent, Context } from 'aws-lambda';
import { Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'upload-service' });
const app = new Router({ logger });

app.get('/ping', () => {
  return { message: 'pong' }; 
});

export const handler = async (event: APIGatewayEvent, context: Context) => app.resolve(event, context);
