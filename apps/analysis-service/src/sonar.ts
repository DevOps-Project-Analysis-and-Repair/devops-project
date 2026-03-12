import { spawn } from "child_process";

const SONAR_ORG = "devops-software-engineering";
// const SONAR_PROJECT_KEY = "devops-software-engineering_just-testing";
// const SONAR_PROJECT_NAME = "just-testing";
const SONAR_TOKEN = "bcd02910cbccb25134ac49d377a55bea5c0ebaa8";
const SONAR_HOST = "https://sonarcloud.io";

// Run the scanner and send the results to the Sonar server.
export function runSonarScanner(projectPath: string, projectId: string): Promise<number> {
  return new Promise((resolve, reject) => {
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

    proc.stdout.on("data", (d) => console.log(d.toString()));
    proc.stderr.on("data", (d) => console.error(d.toString()));

    proc.on("close", (code) => resolve(code ?? 0));
    proc.on("error", reject);
  });
}

export const createSonarProject = async (projectId: string): Promise<boolean> => {
    const result = await fetch("https://sonarcloud.io/api/projects/create", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${SONAR_TOKEN}`,
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

// export const pollSonarCloud = async (projectId: string): Promise<boolean> => {
//     const auth = createBasicAuthHeader();

//     await ;

//     return true;
// };

// export const runSonarScanner = async () => {
//     await execFileAsync("sonar-scanner", { cwd: "/tmp/project" });
//     return { ok: true };
// };