import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const runSonarScanner = async () => {
    await execFileAsync("sonar-scanner", [
        "-Dsonar.projectKey=" + process.env.SONAR_PROJECT_KEY,
        "-Dsonar.sources=.",
        "-Dsonar.host.url=" + process.env.SONAR_HOST_URL,
        "-Dsonar.login=" + process.env.SONAR_TOKEN,
    ], {
        cwd: "/tmp/project",
        env: process.env,
    });

    return { ok: true };
};

// export const runSonarScanner = async () => {
//     await execFileAsync("sonar-scanner", { cwd: "/tmp/project" });
//     return { ok: true };
// };