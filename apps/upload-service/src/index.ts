import { Context } from 'aws-lambda';
import { Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';

const serviceName = 'upload-service'

const logger = new Logger({ serviceName });
const app = new Router({ logger });

app.get(`/${serviceName}/foobar`, () => { return { message: 'barfoo' }; });
app.get(`/${serviceName}/`, () => { return { message: 'howdy world' }; });

export const handler = async (event: unknown, context: Context) => app.resolve(event, context);
