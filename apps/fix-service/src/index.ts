import { BadRequestError, Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';
import { fixCode } from './client';

export const serviceName = 'fix';

const logger = new Logger({ serviceName });
const app = new Router({ logger });

const API_SERVICE_URL = "https://1wk9q92xx1.execute-api.eu-west-1.amazonaws.com";

app.post(`/${serviceName}/projects/:projectId/files/:fileId`, async ({ params: { projectId, fileId } }) => {
  let code: string;
  console.log('start fixing process');

  try {
    // Step 1: Download file
    const DOWNLOAD_URL = `${API_SERVICE_URL}/upload/projects/${projectId}/files/${fileId}`;
    const res = await fetch(DOWNLOAD_URL);
    code = await res.text();
  } catch (error) {
    console.log(error);
    throw new BadRequestError("Could not find the specified file");
  }

  if (!code) throw new BadRequestError("Project ID and File ID don't find the specified file");

  // Step 2: Analyze file
  // Step 3: return the last outputCode
  return await fixCode(code);
});

app.get(`/${serviceName}/health`, async () => {
  return true;
});

export const handler = async (event: unknown, context: Context) => app.resolve(event, context);
