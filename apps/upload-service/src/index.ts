import { Context } from 'aws-lambda';
import { Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const serviceName = 'upload-service';

const logger = new Logger({ serviceName });
const app = new Router({ logger });

const s3client = new S3Client({});
const db = new DynamoDBClient({});

app.post(`/${serviceName}/project`, async () => {
  // 1. create new project in db
  // 2. create jwt to write to project
  // 3. return jwt to user

  return { token: "foobar" };
});

app.get(`/${serviceName}/project/:projectId`, async ({ params: { projectId }}) => {
  // 1. get project from db
  // 2. return project object, including file names
  return { ok: true };
});

app.post(`/${serviceName}/project/:projectId/files`, async ({ params: { projectId }}) => {
  // Note: Body should be send in binary
  // Other values have to be send via the headers/params

  // 1. validate jwt, or fail
  // 2. fetch project from project id, or fail
  // 3. write file to s3
  // 4. add file to project
  // 5. update project

  // things to save (filename, file contents (on s3), file reference to s3, mime-type?)

  return { ok: true };
});

app.get(`/${serviceName}/project/:projectId/files/:fileId`, async ({ params: { projectId, fileId }}) => {
  // 1. get project
  // 2. get file from project
  // 3. return file contents
  
  return { ok: true };
});

app.get(`/${serviceName}/foobar`, () => { return { message: 'barfoo' }; });
app.get(`/${serviceName}/`, () => { return { message: 'howdy world' }; });

export const handler = async (event: unknown, context: Context) => app.resolve(event, context);
