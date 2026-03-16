import { BadRequestError, InternalServerError, NotFoundError, Router, UnauthorizedError } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocument, paginateScan } from "@aws-sdk/lib-dynamodb";
import { Upload } from "@aws-sdk/lib-storage";
import { Context } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

import { createToken, verifyToken } from './auth';
import { appendFile, appendRepairedFile, getLatestProjectFromDb, getProjectFromDb } from './dynamo';
import { Project, ProjectFile } from './types';
import { datestring, isUploadCompleted, latest } from './util';
<<<<<<< HEAD
import { appendRepairedFile, appendFile, getProjectFromDb, appendSonarReport } from './dynamo';
import { SonarAnalysisUpload } from './sonar';
=======
>>>>>>> 4abf1653178e00ca3c496ad4d409a14fe9ce6003

const serviceName = 'upload';

const logger = new Logger({ serviceName });
const app = new Router({ logger });

const s3client = new S3Client({});
const db = new DynamoDBClient({});
const doc = DynamoDBDocument.from(db);

export const TABLE_PROJECTS = "Projects-upload-stack";
export const FILES_BUCKET = "files-upload-stack";
export const TABLE_ANALYSIS = "Projects-analysis-stack";

function latestVersionOfFile(fileId: string, project: Project): ProjectFile | null {
  // Small note, if the file is not the original file, it will never give the latest version.
  // Always use this function with the fileId of the source.
  if (fileId in project.repairedFiles) {
    return latest(project.repairedFiles[fileId])!;
  }

  return findFile(fileId, project);
}

function findFile(fileId: string, project: Project): ProjectFile | null {
  // Find file searches in both the original project files as the repaired files
  for (const file of project.files) {
    if (file.id === fileId) { return file };
  }

  // Flatmap all the repaired for easy searching
  const repairedFiles = Object.values(project.repairedFiles).flatMap(x => x);

  for (const file of repairedFiles) {
    if (file.id === fileId) { return file };
  }

  return null;
}

app.get(`/${serviceName}/health`, () => {
  return true;
});

app.get(`/${serviceName}/projects`, async () => {
  const paginationConfig = { client: doc };
  const tableConfig = {
    TableName: TABLE_PROJECTS,
    Limit: 100
  };

  let projects: Project[] = [];

  for await (const page of paginateScan(paginationConfig, tableConfig)) {
    const pageItems = Object.values(page.Items ?? {}) as Project[];

    projects = projects.concat(pageItems);
  }

  // TODO: Just have this done on the clients?
  // Sort from newest -> oldest
  projects.sort((a, b) => b.createdAt - a.createdAt);

  return projects;
});

app.post(`/${serviceName}/projects`, async () => {
  // 1. create new project in db
  const projectId: string = uuidv4();

  const item: Project = {
    id: projectId,
    name: `Upload ${datestring()}`,
    files: [],
    createdAt: Date.now(),
    repairedFiles: {}
  };

  await doc.put({
    TableName: TABLE_PROJECTS,
    Item: item
  });

  // 2. create jwt to with project id
  // 3. return jwt to user
  return { projectId, token: createToken(projectId) };
});

app.get(`/${serviceName}/projects/:projectId`, async ({ params: { projectId } }) => {
  // 1. get project from db
  // 2. return project object, including file names
  return await getProjectFromDb(doc, projectId);
});

app.get(`/${serviceName}/projects/:projectId/latest`, async ({ params: { projectId } }) => {
  // 1. get project from db
  // 2. return project object, including file names
  // 3. replace all the file references with the latest entry of the repaired file
  return await getLatestProjectFromDb(doc, projectId);
});

app.post(`/${serviceName}/projects/:projectId/files`, async ({ req, params: { projectId } }) => {
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
  });

  const result = await upload.done();

  if (!isUploadCompleted(result)) { throw new InternalServerError(); }

  // 4. add file to project
  await appendFile(db, project.id, {
    id: fileId,
    filename, // do we need to clean filename?
    url: result.Location ?? "",
    mimetype
  });

  return { ok: true };
});

app.post(`/${serviceName}/projects/:projectId/files/:fileId/repaired`, async ({ req, params: { projectId, fileId } }) => {
  // Note: Body should be send in binary

  // 1. fetch project from project id, or fail
  const project = await getProjectFromDb(doc, projectId);

  // 2. get file from project
  const file = findFile(fileId, project);
  if (!file) { throw new NotFoundError(); }

  const repairedFileId = uuidv4();

  // 3. write file to s3
  const upload = new Upload({
    client: s3client,
    params: {
      Bucket: FILES_BUCKET,
      Key: repairedFileId,
      Body: await req.bytes()
    }
  });

  const result = await upload.done();

  if (!isUploadCompleted(result)) { throw new InternalServerError(); }

  const getCurrentIteration = (fileId: string): number => {
    if (fileId in project.repairedFiles) {
      return project.repairedFiles[file.id].length + 1;
    }

    return 1;
  }

  // 4. add file to repaired files
  await appendRepairedFile(db, project.id, file.id, {
    ...file,
    id: repairedFileId,
    iteration: getCurrentIteration(file.id),
    createdAt: Date.now()
  });

  return { ok: true };
});

app.post(`/${serviceName}/projects/:projectId/analysis/sonar`, async ({ req, params: { projectId } }) => {
  const json = await req.json();
  const sonarReport = json as SonarAnalysisUpload;
  console.log(sonarReport);

  await appendSonarReport(db, projectId, sonarReport);

  return { ok: true };
});

app.get(`/${serviceName}/projects/:projectId/files/:fileId`, async ({ res, params: { projectId, fileId } }) => {
  // 1. get project
  const project = await getProjectFromDb(doc, projectId);

  // 2. get file from project
  const file = findFile(fileId, project);
  if (!file) { throw new NotFoundError(); }

  // 3. return file contents
  const result = await s3client.send(new GetObjectCommand({ Bucket: FILES_BUCKET, Key: file.id }));

  res.headers.set('Content-Type', file.mimetype || 'text/plain');
  res.headers.set('Content-Disposition', `inline; filename="${file.filename}"`);

  return result.Body?.transformToWebStream();
});

app.get(`/${serviceName}/projects/:projectId/files/:fileId/latest`, async ({ res, params: { projectId, fileId } }) => {
  // 1. get project
  const project = await getProjectFromDb(doc, projectId);

  // 2. get file from project
  const file = latestVersionOfFile(fileId, project);
  if (!file) { throw new NotFoundError(); }

  // 3. return file contents
  const result = await s3client.send(new GetObjectCommand({ Bucket: FILES_BUCKET, Key: file.id }));

  res.headers.set('Content-Type', file.mimetype || 'text/plain');
  res.headers.set('Content-Disposition', `inline; filename="${file.filename}"`);

  return result.Body?.transformToWebStream();
});

export const handler = async (event: unknown, context: Context) => {
  return app.resolve(event, context);
};
