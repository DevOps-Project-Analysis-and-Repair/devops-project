import { Context } from 'aws-lambda';
import { BadRequestError, InternalServerError, NotFoundError, Router, streamify, UnauthorizedError } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from 'uuid';

import { Project, ProjectFile } from './types';
import { createToken, verifyToken } from './auth';
import { datestring, isUploadCompleted } from './util';

const serviceName = 'upload-service';

const logger = new Logger({ serviceName });
const app = new Router({ logger });

const s3client = new S3Client({});
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
  const filename = req.headers.get('X-File-Name');
  const mimetype = req.headers.get('X-Mime-Type') || '';

  if (!filename || !token) { throw new BadRequestError(); }

  // 1. validate jwt, or fail
  if (!verifyToken(token, projectId)) { throw new UnauthorizedError(); }
  
  // 2. fetch project from project id, or fail
  const project = await doc.get({ TableName: "Projects", Key: { id: projectId }});
  if (!project.Item) { throw new NotFoundError(); }

  // 3. write file to s3
  const fileId = uuidv4();

  const upload = new Upload({
    client: s3client,
    params: {
      Bucket: "uploadservicefiles",
      Key: fileId,
      Body: await req.bytes()
    }
  })

  const result = await upload.done();

  if (!isUploadCompleted(result)) { throw new InternalServerError(); }

  // 4. add file to project
  const item = project.Item as Project;
  item.files.push({
    id: fileId,
    filename, // do we need to clean filename?
    url: result.Location ?? "",
    mimetype
  });

  // 5. update project
  await doc.put({ TableName: "Projects", Item: item});
  
  // things to save (filename, file contents (on s3), file reference to s3, mime-type?)
  return { ok: true };
});

function findFile(fileId: string, project: Project): ProjectFile | null {
  for (const file of project.files) {
    if (file.id === fileId) { return file };
  }

  return null;
}

app.get(`/${serviceName}/project/:projectId/files/:fileId`, async ({ res, params: { projectId, fileId }}) => {
  // 1. get project
  const project = await doc.get({ TableName: "Projects", Key: { id: projectId }});
  if (!project.Item) { throw new NotFoundError(); }
  const item = project.Item as Project;

  // 2. get file from project
  const file = findFile(fileId, item);
  if (!file) { throw new NotFoundError(); }

  // 3. return file contents
  const result = await s3client.send(new GetObjectCommand({ Bucket: "uploadservicefiles", Key: file.id }));
  
  res.headers.set('Content-Type', file.mimetype || 'text/plain');
  res.headers.set('Content-Disposition', `inline; filename="${file.filename}"`);
  
  const stream = result.Body?.transformToWebStream();
  
  return stream;
});

export const handler = async (event: unknown, context: Context) => {
  return app.resolve(event, context);
};
