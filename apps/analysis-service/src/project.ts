import { NotFoundError } from '@aws-lambda-powertools/event-handler/http';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocument, GetCommand } from "@aws-sdk/lib-dynamodb";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { latest, Project} from "shared";
import path from "node:path";
import { TABLE_PROJECTS, FILES_BUCKET } from '.';

const s3Client = new S3Client({});
const dbClient = new DynamoDBClient({});
const doc = DynamoDBDocument.from(dbClient);

export function createUniqueAnalysisDir(): string {
  const prefix = path.join(tmpdir(), "analysis-");
  return mkdtempSync(prefix);
}

// Fetch project from project ID, or fail.
export async function getProjectFromDb(projectId: string): Promise<Project> {
  const cmd = new GetCommand({ TableName: TABLE_PROJECTS, Key: { id: projectId } });
  const res = await doc.send(cmd);

  if (!res.Item) { throw new NotFoundError(); }

  return res.Item as Project;
}

export async function getLatestProjectFromDb(projectId: string): Promise<Project> {
  const project = await getProjectFromDb(projectId);

  project.files = project.files.map(x => {
    if (x.id in project.repairedFiles) {
      return latest(project.repairedFiles[x.id]) ?? x;
    }

    return x;
  });

  return project;
}

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);

  if (existsSync(dirname)) {
    return true;
  }

  ensureDirectoryExistence(dirname);
  mkdirSync(dirname);
}

// Download a project from the S3 bucket into a local directory.
export async function downloadProjectFiles(projectId: string, targetProjectLocation: string): Promise<void> {
  const project = await getLatestProjectFromDb(projectId);

  mkdirSync(targetProjectLocation, { recursive: true });

  // Write each file to the target directory.
  for (const file of project.files) {
    const fileContents = await s3Client.send(new GetObjectCommand({ Bucket: FILES_BUCKET, Key: file.id }));

    if (!fileContents.Body) throw new NotFoundError;

    const targetFileLocation = path.join(targetProjectLocation, file.filename);

    console.log(targetFileLocation);

    const bytes = await fileContents.Body.transformToByteArray();

    ensureDirectoryExistence(targetFileLocation);
    writeFileSync(targetFileLocation, bytes);

    console.log('write successful');
  }
}
