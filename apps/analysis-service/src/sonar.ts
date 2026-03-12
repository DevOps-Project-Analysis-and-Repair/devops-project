import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SONAR_ORG = "devops-software-engineering";
const SONAR_PROJECT_KEY = "devops-software-engineering_just-testing";
const SONAR_PROJECT_NAME = "just-testing";
const SONAR_TOKEN = "bcd02910cbccb25134ac49d377a55bea5c0ebaa8";
const SONAR_HOST = "https://sonarcloud.io";

// Run the scanner and send the results to the Sonar server.
export const runSonarScanner = async (projectPath: string) => {
    await execFileAsync("sonar-scanner", [
        "-Dsonar.organization=" + SONAR_ORG, //process.env.SONAR_ORG_KEY,
        "-Dsonar.projectKey=" + SONAR_PROJECT_KEY, //process.env.SONAR_PROJECT_KEY,
        "-Dsonar.sources=.",
        "-Dsonar.host.url=" + SONAR_HOST, //process.env.SONAR_HOST_URL,
        "-Dsonar.token=" + SONAR_TOKEN, //process.env.SONAR_TOKEN,
    ], {
        cwd: projectPath,
        env: process.env,
    });

    return { ok: true };
};

export const createSonarProject = async (projectId: string): Promise<boolean> => {
    const auth = createBasicAuthHeader();

    await fetch("https://sonarcloud.io/api/projects/create", {
        method: "POST",
        headers: {
            Authorization: auth,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            organization: SONAR_ORG,
            project: SONAR_PROJECT_KEY,
            name: SONAR_PROJECT_NAME
        })
    });

    return true;
};

// export const pollSonarCloud = async (projectId: string): Promise<boolean> => {
//     const auth = createBasicAuthHeader();

//     await ;

//     return true;
// };

function createBasicAuthHeader(): string {
    return "Basic " + Buffer.from(`${SONAR_TOKEN}:`).toString("base64");
}

// export const runSonarScanner = async () => {
//     await execFileAsync("sonar-scanner", { cwd: "/tmp/project" });
//     return { ok: true };
// };