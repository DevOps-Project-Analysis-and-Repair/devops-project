import { Context } from 'aws-lambda';
import { BadRequestError, InternalServerError, NotFoundError, Router, UnauthorizedError } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocument, paginateScan } from "@aws-sdk/lib-dynamodb";
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

const TABLE_PROJECTS = "Projects";
const FILES_BUCKET = "uploadservicefiles";

async function getProjectFromDb(doc: DynamoDBDocument, projectId: string): Promise<Project> {
  const cmd = new GetCommand({ TableName: TABLE_PROJECTS, Key: { id: projectId }});
  const res = await doc.send(cmd);

  if (!res.Item) { throw new NotFoundError(); }

  return res.Item as Project;
}

function findFile(fileId: string, project: Project): ProjectFile | null {
  for (const file of project.files) {
    if (file.id === fileId) { return file };
  }

  return null;
}

app.get(`/${serviceName}/project`, async () => {
  const paginationConfig = { client: doc };
  const tableConfig = {
    TableName: TABLE_PROJECTS,
    Limit: 100
  };

  let projects: Project[] = [];

  for await (const page of paginateScan(paginationConfig, tableConfig)) {
    console.log(Object.entries(page.Items ?? {}));
  }

  // projects.sort((a, b) => a.createdAt - b.createdAt);

  return projects;
});

app.post(`/${serviceName}/project`, async () => {
  // 1. create new project in db
  const projectId: string = uuidv4();

  const item: Project = {
    id: projectId,
    name: `Upload ${datestring()}`,
    files: [],
    createdAt: Date.now(),
  };

  await doc.put({
    TableName: TABLE_PROJECTS,
    Item: item
  });

  // 2. create jwt to with project id
  // 3. return jwt to user
  return { projectId, token: createToken(projectId) };
});

app.get(`/${serviceName}/project/:projectId`, async ({ params: { projectId }}) => {
  // 1. get project from db
  // 2. return project object, including file names
  return await getProjectFromDb(doc, projectId);
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
  const project = await getProjectFromDb(doc, projectId);

  // 3. write file to s3
  const fileId = uuidv4();

  const upload = new Upload({
    client: s3client,
    params: {
      Bucket: FILES_BUCKET,
      Key: fileId,
      Body: await req.bytes()
    }
  })

  const result = await upload.done();

  if (!isUploadCompleted(result)) { throw new InternalServerError(); }

  // 4. add file to project
  project.files.push({
    id: fileId,
    filename, // do we need to clean filename?
    url: result.Location ?? "",
    mimetype
  });

  // 5. update project
  await doc.put({ TableName: TABLE_PROJECTS, Item: project});
  
  // things to save (filename, file contents (on s3), file reference to s3, mime-type?)
  return project;
});

app.get(`/${serviceName}/project/:projectId/files/:fileId`, async ({ res, params: { projectId, fileId }}) => {
  // 1. get project
  const project = await getProjectFromDb(doc, projectId);

  // 2. get file from project
  const file = findFile(fileId, project);
  if (!file) { throw new NotFoundError(); }

  // 3. return file contents
  const result = await s3client.send(new GetObjectCommand({ Bucket: FILES_BUCKET, Key: file.id }));
  
  res.headers.set('Content-Type', file.mimetype || 'text/plain');
  res.headers.set('Content-Disposition', `inline; filename="${file.filename}"`);
  
  const stream = result.Body?.transformToWebStream();
  
  return stream;
});

export const handler = async (event: unknown, context: Context) => {
  return app.resolve(event, context);
};
