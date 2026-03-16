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
const API_BASE_URL = "https://1wk9q92xx1.execute-api.eu-west-1.amazonaws.com";

export type SonarRepairIssue = {
    issueKey: string;

    rule: string;
    type: "BUG" | "VULNERABILITY" | "CODE_SMELL";
    severity: "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR" | "INFO";

    message: string;

    filePath: string;

    line?: number;

    startLine?: number;
    endLine?: number;
    startOffset?: number;
    endOffset?: number;

    tags?: string[];
};

type SonarAnalysisUpload = {
    analysisId: string
    projectKey: string
    fetchedAt: string

    metrics: {}

    issues: SonarRepairIssue[]
}

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
        console.error();
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
        console.error(`Sonar project creation failed: ${result.status} ${text}`);
    }
    console.log(result.status);

    return true;
};

export const makeSonarProjectPublic = async (projectId: string): Promise<Boolean> => {
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

    tags: issue.tags,
});

// export const groupIssuesByFile = (issues: any[]) => {
//     const map: Record<string, any[]> = {};

//     for (const issue of issues) {
//         const fileKey = issue.component;

//         if (!map[fileKey]) {
//             map[fileKey] = [];
//         }

//         map[fileKey].push(issue);
//     }

//     return map;
// };



export const createAnalysisReport = async (projectId: string, analysisId: string): Promise<SonarAnalysisUpload> => {

    const projectKey = `${SONAR_ORG}_${projectId}`;

    // fetch in parallel (important)
    const [issuesRaw, metrics] = await Promise.all([
        getAllSonarIssues(projectId),
        getSonarMetrics(projectId)
    ]);

    // map to repair shape
    const issues = issuesRaw.map(mapSonarIssueForRepair);

    console.log(issues);
    console.log(metrics);

    return {
        analysisId,
        projectKey,
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