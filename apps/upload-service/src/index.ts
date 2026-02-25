import { Context } from 'aws-lambda';
import { NotFoundError, Router, UnauthorizedError } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient, GetCommand, DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

import { Project } from './types';
import { createToken, verifyToken } from './auth';
import { datestring } from './util';

const serviceName = 'upload-service';

const logger = new Logger({ serviceName });
const app = new Router({ logger });

// const s3client = new S3Client({});
const db = new DynamoDBClient({});
const doc = DynamoDBDocument.from(db);

app.post(`/${serviceName}/project`, async () => {
  // 1. create new project in db
  const projectId: string = uuidv4();

  const item: Project = {
    id: projectId,
    name: `Upload ${datestring()}`,
    files: []
  };

  await doc.put({
    TableName: "Projects",
    Item: item
  });

  // 2. create jwt to with project id
  // 3. return jwt to user
  return { projectId, token: createToken(projectId) };
});

app.get(`/${serviceName}/project/:projectId`, async ({ params: { projectId }}) => {
  // 1. get project from db
  const cmd = new GetCommand({ TableName: "Projects", Key: { id: projectId }});
  const res = await doc.send(cmd);

  // 2. return project object, including file names
  return res.Item;
});

app.post(`/${serviceName}/project/:projectId/files`, async ({ req, params: { projectId }}) => {
  // Note: Body should be send in binary
  // Other values have to be send via the headers/params
  const token = req.headers.get('X-Project-Token');

  // 1. validate jwt, or fail
  if (!verifyToken(token ?? '', projectId)) { throw new UnauthorizedError(); }
  
  // 2. fetch project from project id, or fail
  const project = await doc.get({ TableName: "Projects", Key: { id: projectId }});
  if (!project.Item) { throw new NotFoundError(); }

  // 3. write file to s3
  const fileBinary = await req.arrayBuffer();
  const fileId = uuidv4();

  // 4. add file to project
  const item = project.Item as Project;
  item.files.push({
    id: fileId,
    filename: "foobar",
    url: "https://example.com",
    mimetype: ""
  });

  // 5. update project
  await doc.put({ TableName: "Projects", Item: item});
  
  // things to save (filename, file contents (on s3), file reference to s3, mime-type?)
  return { ok: true };
});

app.get(`/${serviceName}/project/:projectId/files/:fileId`, async ({ params: { projectId, fileId }}) => {
  // 1. get project
  // 2. get file from project
  // 3. return file contents
  
  return { ok: true };
});

export const handler = async (event: unknown, context: Context) => {
  return app.resolve(event, context);
};
