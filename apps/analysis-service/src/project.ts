import { NotFoundError } from '@aws-lambda-powertools/event-handler/http';
import { GetCommand, DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const s3Client = new S3Client({});
const db = new DynamoDBClient({});
const doc = DynamoDBDocument.from(db);

export type ProjectFile = {
    id: string,
    url: string, // s3 bucket url
    filename: string,
    mimetype: string,
}

export type Project = {
    id: string,
    name: string,
    files: ProjectFile[];
    createdAt: number,
};

// TODO: Move to env.
const TABLE_PROJECTS = "Projects-upload-stack";
const FILES_BUCKET = "files-upload-stack";

// Fetch project from project ID, or fail.
export async function getProjectFromDb(projectId: string): Promise<Project> {
  const cmd = new GetCommand({ TableName: TABLE_PROJECTS, Key: { id: projectId }});
  const res = await doc.send(cmd);

  if (!res.Item) { throw new NotFoundError(); }

  return res.Item as Project;
}

// Store a project locally.
export async function downloadProjectFiles(projectId: string, targetProjectLocation: string): Promise<void> {

    const project = await getProjectFromDb(projectId);

    mkdirSync(targetProjectLocation, { recursive: true });

    // Write each file to the target directory.
    for (const file of project.files) {
        
        const fileContents = await s3Client.send(new GetObjectCommand({ Bucket: FILES_BUCKET, Key: file.id }));

        if(!fileContents.Body) throw new NotFoundError;

        const targetFileLocation = path.join(targetProjectLocation, file.filename);
        const bytes = await fileContents.Body.transformToByteArray();
        writeFileSync(targetFileLocation, bytes);
    }
}