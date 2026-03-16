import { SonarAnalysisUpload } from "./sonar";

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
