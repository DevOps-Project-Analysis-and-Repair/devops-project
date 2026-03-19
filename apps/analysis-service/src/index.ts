import { Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

import { createUniqueAnalysisDir, downloadProjectFiles } from './project';
import { createAnalysisReport, createSonarProject, existsSonarProject, makeSonarProjectPublic, pollSonarCloud, runSonarScanner, uploadAnalysisReport } from './sonar';

export const SERVICE_NAME = process.env.SERVICE_NAME
const LOGGER = new Logger({ SERVICE_NAME });
const APP = new Router({ logger: LOGGER });

export const FILES_BUCKET = process.env.S3_BUCKET_NAME
export const TABLE_PROJECTS = process.env.UPLOAD_TABLE_NAME

const API_SERVICE_URL = "https://1wk9q92xx1.execute-api.eu-west-1.amazonaws.com";

APP.get(`/${SERVICE_NAME}/health`, async () => {
    return true;
});

APP.post(`/${SERVICE_NAME}/:projectId/sonar/:projectAnalysisId`, async ({ params: { projectId, projectAnalysisId } }) => {
  // Download project from S3 bucket.
  const analysisDir = createUniqueAnalysisDir();
  console.log("Downloading project files...");
  await downloadProjectFiles(projectId, analysisDir);

  console.log("Downloaded files");

  // Ensure that there is a Sonar project to store the analysis report.
  const exists = await existsSonarProject(projectId);
  if(!exists) {
    console.log("Creating Sonar project...");
    await createSonarProject(projectId);
  }
  else {
    console.log("Sonar project exists already.");
  }

  // Run the Sonar scanner.
  console.log("Scanning files...");
  const ceTaskUrl = await runSonarScanner(analysisDir, projectId);
  console.log("ceTaskUrl", ceTaskUrl);

  // Poll if the Sonar report is ready.
  console.log("Polling Sonar...");
  const analysisId = await pollSonarCloud(ceTaskUrl);
  console.log("analysisId", analysisId);

  // Change the project visibility.
  await makeSonarProjectPublic(projectId);

  // Create a custom report to send to the S3 bucket.
  console.log("Creating report...");
  const report = await createAnalysisReport(projectId, analysisId, projectAnalysisId);

  // Upload the analysis ID to the S3 bucket so that metrics and issues can be retrieved.
  console.log("Uploading report...");
  await uploadAnalysisReport(projectId, report);

  // Clean
  console.log("Done");

  return { ok: true };
});

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Scan a project with Sonar.
APP.post(`/${SERVICE_NAME}/:projectId`, async ({ params: { projectId } }) => {
    const analysisId = uuidv4();

    // Start background task that will timeout in the API gateway, but will complete in the background

    await Promise.any([
      fetch(`${API_SERVICE_URL}/analysis/${projectId}/sonar/${analysisId}`, { method: 'POST' }),
      sleep(5000) // essentially wait 20 secs, so the call can be executed by the IO layer
    ]);

    return { analysisId }
});

export const handler = async (event: unknown, context: Context) => APP.resolve(event, context);
