import { BadRequestError, UnauthorizedError, Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';

import { downloadProjectFiles } from './project';
import { createSonarProject, pollSonarCloud, runSonarScanner } from './sonar';

const serviceName = 'analysis';
const logger = new Logger({ serviceName });
const app = new Router({ logger });

app.get(`/${serviceName}/health`, async () => {
  return true;
});

// Scan a project with Sonar.
app.post(`/${serviceName}/:projectId`, async ({ params: { projectId } }) => {

    // const id = uuidv4();

    // Download project from S3 bucket.
    const projectPath = '/tmp/project';
    await downloadProjectFiles(projectId, projectPath);

    // Create a new Sonar project to store the analysis report.
    await createSonarProject(projectId);

    // Run the Sonar scanner.
    const ceTaskUrl = await runSonarScanner(projectPath, projectId);
    console.log(ceTaskUrl);

    // Poll for the Sonar report.
    const analysisId = await pollSonarCloud(ceTaskUrl);

    // Upload the scanner logs to the S3 bucket.
    // TODO: In the same way as we did for the project files in the upload handler.

    // Clean

    return analysisId;
});

export const handler = async (event: unknown, context: Context) => app.resolve(event, context);
