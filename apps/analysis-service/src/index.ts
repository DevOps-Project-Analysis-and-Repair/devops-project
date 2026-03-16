import { BadRequestError, UnauthorizedError, Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';

import { downloadProjectFiles } from './project';
import { createAnalysisReport, createSonarProject, existsSonarProject, makeSonarProjectPublic, pollSonarCloud, runSonarScanner, uploadAnalysisReport } from './sonar';

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
    console.log("Downloading project files...");
    await downloadProjectFiles(projectId, projectPath);

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
    const ceTaskUrl = await runSonarScanner(projectPath, projectId);
    console.log("ceTaskUrl", ceTaskUrl);
    
    // Change the project visibility while waiting for the Sonar report to be created.
    await makeSonarProjectPublic(projectId);

    // Poll if the Sonar report is ready.
    console.log("Polling Sonar...");
    const analysisId = await pollSonarCloud(ceTaskUrl);
    console.log("analysisId", analysisId);

    // Create a custom report to send to the S3 bucket.
    console.log("Creating report...");
    const report = await createAnalysisReport(projectId, analysisId);

    // Upload the analysis ID to the S3 bucket so that metrics and issues can be retrieved.
    console.log("Uploading report...");
    await uploadAnalysisReport(projectId, report);

    // Clean
    console.log("Done");

    return analysisId;
});

export const handler = async (event: unknown, context: Context) => app.resolve(event, context);
