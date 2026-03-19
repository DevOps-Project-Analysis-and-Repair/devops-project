export const API_BASE_URL = "https://1wk9q92xx1.execute-api.eu-west-1.amazonaws.com";

export interface UploadProject {
  files: UploadedFile[];
  id: string;
  name: string;
  createdAt: number;
  repairedFiles: Record<string, RepairedFile[]>;
  analysis: AnalysisResults;
}
export interface UploadedFile {
  id: string;
  url: string;
  mimetype: string;
  filename: string;
}

export type AnalysisResults = {
  sonarIds: string[];
}

export type RepairedFile = UploadedFile & {
  iteration: number;
  createdAt: number;
}
