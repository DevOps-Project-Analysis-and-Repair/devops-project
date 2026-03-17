export type ProjectFile = {
  id: string,
  url: string, // s3 bucket url
  filename: string,
  mimetype: string,
}

export type Project = {
  id: string,
  name: string,
  files: ProjectFile[],
  createdAt: number,
  repairedFiles: Record<string, RepairedFile[]>,
};

export type AnalysisResults = {
  projectId: string,
  reports: SonarAnalysisUpload[],
}

export type RepairedFile = ProjectFile & {
  iteration: number,
  createdAt: number,
}

// Analysis related types
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

export type SonarAnalysisUpload = {
    analysisId: string
    projectKey: string
    fetchedAt: string
    projectAnalysisId: string

    metrics: {}

    issues: SonarRepairIssue[]
}

export type ProjectAnalysis = {
  sonar: SonarAnalysisUpload[],
}
