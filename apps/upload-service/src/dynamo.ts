import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { AnalyzedFile, Project, ProjectFile } from "./types";
import { TABLE_PROJECTS } from ".";
import { NotFoundError } from "@aws-lambda-powertools/event-handler/http";

export async function getProjectFromDb(doc: DynamoDBDocument, projectId: string): Promise<Project> {
  const cmd = new GetCommand({ TableName: TABLE_PROJECTS, Key: { id: projectId }});
  const res = await doc.send(cmd);

  if (!res.Item) { throw new NotFoundError(); }

  return res.Item as Project;
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

export async function appendAnalyzedFile(db: DynamoDBClient, projectId: string, analyzedFile: AnalyzedFile): Promise<void> {
  const key = analyzedFile.id;

  await db.send(new UpdateCommand({
    TableName: "Projects",
    Key: { id: projectId },
    UpdateExpression: "SET analyzedFiles.#key = list_append(if_not_exists(analyzedFiles.#key, :empty), :newFile)",
    ExpressionAttributeNames: {
      "#key": key,
    },
    ExpressionAttributeValues: {
      ":newFile": [analyzedFile],
      ":empty": [],
    },
    ConditionExpression: "attribute_exists(id)",
  }));
}
