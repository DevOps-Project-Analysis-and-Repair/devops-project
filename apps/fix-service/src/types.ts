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

  metrics: {}

  issues: SonarRepairIssue[]
}

export type ProjectAnalysis = {
  sonar: SonarAnalysisUpload[],
}
