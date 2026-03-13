import { spawn } from "child_process";
import { once } from "events";
import path from "path";
import fs from "fs/promises";

const SONAR_ORG = "devops-software-engineering";
// const SONAR_PROJECT_KEY = "devops-software-engineering_just-testing";
// const SONAR_PROJECT_NAME = "just-testing";
const SONAR_TOKEN = "bcd02910cbccb25134ac49d377a55bea5c0ebaa8";
const SONAR_HOST = "https://sonarcloud.io";

const SONAR_AUTH = `Bearer ${SONAR_TOKEN}`;

// Run the scanner and send the results to the Sonar server.
export const runSonarScanner = async (projectPath: string, projectId: string): Promise<string> => {
    const proc = spawn("sonar-scanner", [
        "-Dsonar.organization=" + SONAR_ORG,
        "-Dsonar.projectKey=" + `${SONAR_ORG}_${projectId}`,
        "-Dsonar.sources=.",
        "-Dsonar.host.url=" + SONAR_HOST,
        "-Dsonar.token=" + SONAR_TOKEN,
        "-Dsonar.scanner.skipJreProvisioning=true",
        "-Dsonar.scanner.skipNodeProvisioning=true",
        "-Dsonar.nodejs.executable=/var/lang/bin/node",
        "-Dsonar.scanner.skipSystemTruststore=true",
        "-Dsonar.scm.disabled=true",
        "-Dsonar.javascript.node.maxspace=256"
        ], {
            cwd: projectPath,
            env: process.env
        });

    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);

    const [code] = await once(proc, "close");

    if(code != 0) {
        throw new Error();
    }

    const reportPath = path.join(projectPath, ".scannerwork", "report-task.txt");
    const ceTaskUrl = (await fs.readFile(reportPath, "utf8")).match(/^ceTaskUrl=(.*)$/m)?.[1]!;

    return ceTaskUrl;
}

export const createSonarProject = async (projectId: string): Promise<boolean> => {
    const result = await fetch("https://sonarcloud.io/api/projects/create", {
        method: "POST",
        headers: {
            Authorization: SONAR_AUTH,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            organization: SONAR_ORG,
            project: `${SONAR_ORG}_${projectId}`,
            name: projectId
        })
    });

    if (!result.ok) {
        const text = await result.text();
        throw new Error(`Sonar project creation failed: ${result.status} ${text}`);
    }

    return true;
};

export const existsSonarProject = async (projectId: string): Promise<boolean> => {
    const result = await fetch(`https://sonarcloud.io/api/projects/search?organization=${SONAR_ORG}&projects=${SONAR_ORG}_${projectId}`, {
        method: "GET",
        headers: {
            Authorization: SONAR_AUTH
        }
    });

    if (!result.ok) {
        throw new Error("Failed to check if Sonar project exists");
    }

    return result.ok;
}

export const pollSonarCloud = async (ceTaskUrl: string, intervalMs: number = 2000): Promise<string> => {

    while (true) {
        const result = await fetch(ceTaskUrl, {
            method: "GET",
            headers: {
                Authorization: SONAR_AUTH,
                Accept: "application/json",
            },
        });

        const data = await result.json();
        const status = data?.task?.status;

        if (status === "SUCCESS") {
            return data.task.analysisId;
        }

        if (status === "FAILED" || status === "CANCELED") {
            throw new Error();
        }

        await sleep(intervalMs);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
