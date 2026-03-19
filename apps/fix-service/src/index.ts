import { BadRequestError, HttpStatusCodes, Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';
import { fixCode } from './client';
import { Project, ProjectAnalysis, SonarRepairIssue, findFile } from 'shared';

export const SERVICE_NAME = process.env.SERVICE_NAME
const logger = new Logger({ SERVICE_NAME });
const app = new Router({ logger: logger });

const API_SERVICE_URL = "https://1wk9q92xx1.execute-api.eu-west-1.amazonaws.com";

async function downloadProject(projectId: string): Promise<Project> {
  const url = `${API_SERVICE_URL}/upload/projects/${projectId}`;
  const res = await fetch(url);

  return await res.json();
}

async function downloadFile(projectId: string, fileId: string): Promise<string> {
  const url = `${API_SERVICE_URL}/upload/projects/${projectId}/files/${fileId}/latest`;
  const res = await fetch(url);

  return await res.text();
}

async function downloadAnalysis(projectId: string): Promise<ProjectAnalysis> {
  const url = `${API_SERVICE_URL}/upload/projects/${projectId}/analysis`;
  const res = await fetch(url);

  return await res.json();
}

async function uploadRepair(projectId: string, fileId: string, code: string): Promise<void> {
  await fetch(`${API_SERVICE_URL}/upload/projects/${projectId}/files/${fileId}/repaired`,
    {
      method: 'POST',
      body: code
    }
  );
}

function getFilePathFromProject(project: Project, fileId: string): string | null {
  const file = findFile(fileId, project);

  if (file === null) { return null; }

  return file.filename;
}

function getLatestSonarIssues(analysis: ProjectAnalysis, filePath: string): SonarRepairIssue[] {
  if (analysis.sonar.length === 0) { return []; }
  const latest = analysis.sonar[analysis.sonar.length - 1];

  return latest.issues.filter(x => x.filePath === filePath) ?? [];
}

app.post(`/${SERVICE_NAME}/projects/:projectId/files/:fileId`, async ({ params: { projectId, fileId } }) => {
  // Step 1: Download file
  const input = await downloadFile(projectId, fileId);
  const project = await downloadProject(projectId);

  if (!input) throw new BadRequestError("Project ID and File ID don't find the specified file");

  // Step 2: Download analysis from the upload service
  const analysis = await downloadAnalysis(projectId);
  const sonarIssues = getLatestSonarIssues(analysis, getFilePathFromProject(project, fileId)!);

  // Step 3: Analyze file
  const response = await fixCode(input, sonarIssues);

  const lines = response.split('\n');
  const code = lines.slice(1, -1).join('\n');

  // Step 4: Upload the code back to the upload service
  await uploadRepair(projectId, fileId, code);

  // Step 4: Return ok
  return { ok: true };
});

app.get(`/${SERVICE_NAME}/health`, async () => {
  return { ok: true };
});

app.errorHandler(Error, async (error, reqCtx) => {
  logger.error('error occurred:', error);

  return {
    statusCode: HttpStatusCodes.BAD_REQUEST,
    message: `Bad request: ${error.message} - ${reqCtx.req.headers.get('x-correlation-id')}`,
  };
});

export const handler = async (event: unknown, context: Context) => app.resolve(event, context);
