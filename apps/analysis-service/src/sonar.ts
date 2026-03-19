/* eslint-disable @typescript-eslint/no-explicit-any */
import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs/promises";
import path from "node:path";
import { SonarAnalysisUpload, SonarRepairIssue } from "shared";

const SONAR_ORG = process.env.SONARORG;
const SONAR_TOKEN = process.env.SONAR_TOKEN;
const SONAR_HOST = process.env.SONAR_HOST;

const SONAR_AUTH = `Bearer ${SONAR_TOKEN}`;
const API_BASE_URL = "https://1wk9q92xx1.execute-api.eu-west-1.amazonaws.com";

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

    if (code != 0) {
        throw new Error();
    }

    const reportPath = path.join(projectPath, ".scannerwork", "report-task.txt");
    const ceTaskUrl = (await fs.readFile(reportPath, "utf8")).match(/^ceTaskUrl=(.*)$/m)?.[1] || '';

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
        console.error(`Sonar project creation failed: ${result.status} ${text}`);
    }
    console.log(result.status);

    return true;
};

export const makeSonarProjectPublic = async (projectId: string): Promise<boolean> => {
    const visibilityResult = await fetch("https://sonarcloud.io/api/projects/update_visibility", {
        method: "POST",
        headers: {
            Authorization: SONAR_AUTH,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            project: `${SONAR_ORG}_${projectId}`,
            visibility: "public"
        })
    });

    if (!visibilityResult.ok) {
        const text = await visibilityResult.text();
        console.error(`Sonar visibility update failed: ${visibilityResult.status} ${text}`);
    }

    console.log(visibilityResult.status);

    return true;
}

export const existsSonarProject = async (projectId: string): Promise<boolean> => {
    const result = await fetch(`https://sonarcloud.io/api/projects/search?organization=${SONAR_ORG}&projects=${SONAR_ORG}_${projectId}`, {
        method: "GET",
        headers: {
            Authorization: SONAR_AUTH
        }
    });


    if (!result.ok) {
        console.error(`Sonar check failed with HTTP ${result.status}`);
    }

    const json = await result.json();
    console.log(json);

    return json.paging?.total ?? 0 > 0;
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
            console.error();
        }

        await sleep(intervalMs);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getSonarMetrics = async (projectId: string): Promise<any> => {
    const result = await fetch(
        `https://sonarcloud.io/api/measures/component?component=${SONAR_ORG}_${projectId}&metricKeys=coverage,bugs,vulnerabilities,code_smells,duplicated_lines_density,ncloc,reliability_rating,security_rating,sqale_rating,alert_status`,
        {
            method: "GET",
            headers: {
                Authorization: SONAR_AUTH,
                Accept: "application/json",
            },
        }
    );

    if (!result.ok) {
        console.error(`Sonar metrics fetch failed: ${result.status}`);
    }

    const json = await result.json();
    return json.component?.measures ?? [];
};

export const getQualityGate = async (analysisId: string): Promise<any> => {
    const result = await fetch(
        `https://sonarcloud.io/api/qualitygates/project_status?analysisId=${analysisId}`,
        {
            method: "GET",
            headers: {
                Authorization: SONAR_AUTH,
                Accept: "application/json",
            },
        }
    );

    if (!result.ok) {
        console.error(`Sonar quality gate fetch failed: ${result.status}`);
    }

    const json = await result.json();
    return json.projectStatus;
};

export const getSonarFileKeys = async (projectId: string): Promise<string[]> => {
    let page = 1;
    const pageSize = 500;
    let all: string[] = [];

    while (true) {
        const result = await fetch(
            `https://sonarcloud.io/api/components/tree?component=${SONAR_ORG}_${projectId}&qualifiers=FIL&p=${page}&ps=${pageSize}`,
            {
                method: "GET",
                headers: {
                    Authorization: SONAR_AUTH,
                    Accept: "application/json",
                },
            }
        );

        if (!result.ok) {
            console.error(`Sonar file keys fetch failed: ${result.status}`);
            break;
        }

        const json = await result.json();

        all = all.concat(json.components.map((c: any) => c.key));

        if (page * pageSize >= json.paging.total) break;

        page++;
    }

    return all;
};

export const getAllSonarIssues = async (projectId: string): Promise<any[]> => {
    let page = 1;
    const pageSize = 100;
    let all: any[] = [];

    while (true) {
        const result = await fetch(
            `https://sonarcloud.io/api/issues/search?componentKeys=${SONAR_ORG}_${projectId}&p=${page}&ps=${pageSize}`,
            {
                method: "GET",
                headers: {
                    Authorization: SONAR_AUTH,
                    Accept: "application/json",
                },
            }
        );

        if (!result.ok) {
            console.error(`Sonar issues fetch failed: ${result.status}`);
            break;
        }

        const json = await result.json();

        all = all.concat(json.issues);

        if (page * pageSize >= json.total) break;

        page++;
    }

    return all;
};

export const mapSonarIssueForRepair = (issue: any): SonarRepairIssue => ({
    issueKey: issue.key,
    rule: issue.rule,
    type: issue.type,
    severity: issue.severity,
    message: issue.message,

    filePath: issue.component.split(":")[1],

    line: issue.line,

    startLine: issue.textRange?.startLine,
    endLine: issue.textRange?.endLine,
    startOffset: issue.textRange?.startOffset,
    endOffset: issue.textRange?.endOffset,

    status: issue.status,

    tags: issue.tags,
});

export const createAnalysisReport = async (projectId: string, analysisId: string, projectAnalysisId: string): Promise<SonarAnalysisUpload> => {

    const projectKey = `${SONAR_ORG}_${projectId}`;

    // Fetch in parallel
    const [issuesRaw, metrics] = await Promise.all([
        getAllSonarIssues(projectId),
        getSonarMetrics(projectId)
    ]);

    // Map to repair shape
    const issues = issuesRaw.map(mapSonarIssueForRepair);

    console.log(issues);
    console.log(metrics);

    return {
        analysisId,
        projectKey,
        projectAnalysisId,
        fetchedAt: new Date().toISOString(),
        metrics,
        issues,
    };
};

export async function uploadAnalysisReport(projectId: string, report: SonarAnalysisUpload): Promise<void> {
    const result = await fetch(`${API_BASE_URL}/upload/projects/${projectId}/analysis/sonar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(report)
    });

    if (!result.ok) {
        console.error(`Upload failed: ${result.status}`);
    }
}