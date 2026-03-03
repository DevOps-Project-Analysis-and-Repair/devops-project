import { BadRequestError, Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';
import { fixCode } from './client';

const serviceName = 'fix';

const logger = new Logger({ serviceName });
const app = new Router({ logger });

const API_SERVICE_URL = "https://jjz7wxr827.execute-api.eu-west-1.amazonaws.com";

app.post(`/${serviceName}/projects/:projectId/files/:fileId`, async ({ params: { projectId, fileId } }) => {
  let text: string;
  console.log('start xt');
  try {
    // Step 1: Download file
    const DOWNLOAD_URL = `${API_SERVICE_URL}/upload/projects/${projectId}/files/${fileId}`;
    const res = await fetch(DOWNLOAD_URL);
    text = await res.text();
  } catch (error) {
    throw new BadRequestError("Could not find the specified file");
  }

  if (!text) throw new BadRequestError("Project ID and File ID don't find the specified file");

  // Step 2: Analyze file
  let outputCode: string = text;
  try {
    for (const index of Array(2)) {
      console.log(`Analyzing code loop ${index}`);
      outputCode = await fixCode(outputCode);
    }
  } catch (error) {
    console.log(error);
    throw new BadRequestError("Fixing failed");
  }




  // Step 3: return the last outputCode
  return outputCode;
});

export const handler = async (event: unknown, context: Context) => app.resolve(event, context);
