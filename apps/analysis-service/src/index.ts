import { BadRequestError, UnauthorizedError, Router } from '@aws-lambda-powertools/event-handler/http';
import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';

import { downloadProjectFiles } from './project';
import { verifyToken } from './auth';
import { runSonarScanner } from './scanner';

const serviceName = 'sonar';
const logger = new Logger({ serviceName });
const app = new Router({ logger });

// Scan a project with Sonar.
app.post(`/${serviceName}/scan/:projectId`, async ({ req, params: { projectId } }) => {

    // Authorize request.
    const token = req.headers.get('X-Project-Token');
    if (!token) { throw new BadRequestError(); }
    if (!verifyToken(token, projectId)) { throw new UnauthorizedError(); }

    // Download project from S3 bucket.
    await downloadProjectFiles(projectId, '/tmp');

    // Run the Sonar scanner.
    const exitCode = await runSonarScanner();

    // Upload the scanner logs to the S3 bucket.
    // TODO: In the same way as we did for the project files in the upload handler.

    return exitCode;
});

export const handler = async (event: unknown, context: Context) => app.resolve(event, context);
