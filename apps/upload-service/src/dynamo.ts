import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, GetCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { RepairedFile, Project, ProjectFile } from "./types";
import { TABLE_PROJECTS, TABLE_ANALYSIS } from ".";
import { NotFoundError } from "@aws-lambda-powertools/event-handler/http";
import { SonarAnalysisUpload } from "./sonar";
import { latest } from "./util";

export async function getProjectFromDb(doc: DynamoDBDocument, projectId: string): Promise<Project> {
  const cmd = new GetCommand({ TableName: TABLE_PROJECTS, Key: { id: projectId }});
  const res = await doc.send(cmd);

  if (!res.Item) { throw new NotFoundError(); }

  return {
    id: res.Item.id,
    name: res.Item.name,
    files: res.Item.files,
    createdAt: res.Item.createdAt,
    repairedFiles: res.Item.repairedFiles ?? {}
  }
}

export async function getLatestProjectFromDb(doc: DynamoDBDocument, projectId: string): Promise<Project> {
  const project = await getProjectFromDb(doc, projectId);

  project.files = project.files.map(x => {
    if (x.id in project.repairedFiles) {
      return latest(project.repairedFiles[x.id]) ?? x;
    }

    return x;
  });

  return project;
}

export async function appendFile(db: DynamoDBClient, projectId: string, newFile: ProjectFile): Promise<void> {
  await db.send(new UpdateCommand({
    TableName: TABLE_PROJECTS,
    Key: { id: projectId },
    UpdateExpression: "SET files = list_append(files, :newFile)",
    ExpressionAttributeValues: {
      ":newFile": [newFile],
    },
    ConditionExpression: "attribute_exists(id)",
  }));
}

export async function appendRepairedFile(db: DynamoDBClient, projectId: string, fileId: string, repairedFile: RepairedFile): Promise<void> {
  const key = fileId;

  await db.send(new UpdateCommand({
    TableName: TABLE_PROJECTS,
    Key: { id: projectId },
    UpdateExpression: "SET repairedFiles.#key = list_append(if_not_exists(repairedFiles.#key, :empty), :newFile)",
    ExpressionAttributeNames: {
      "#key": key,
    },
    ExpressionAttributeValues: {
      ":newFile": [repairedFile],
      ":empty": [],
    },
    ConditionExpression: "attribute_exists(id)",
  }));
}

export async function appendSonarReport(doc: DynamoDBClient, projectId: string, sonarReport: SonarAnalysisUpload): Promise<void> {
  const cmd = new UpdateCommand({
    TableName: TABLE_ANALYSIS,
    Key: { projectId },
    UpdateExpression: "SET analysis.sonar = list_append(if_not_exists(analysis.sonar, :empty), :newReport)",
    ExpressionAttributeValues: {
      ":newReport": [sonarReport],
      ":empty": [],
    },
  });

  await doc.send(cmd);
}
