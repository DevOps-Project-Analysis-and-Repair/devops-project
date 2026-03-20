import { chunk } from "../utils";
import { API_BASE_URL, type UploadProject } from "../utils/api";
import { flattenFileSystem, type FileSystemDirectory, type FileSystemFile } from "../utils/filesystem";

type ProjectUploadResponse = { projectId: string, token: string };

const UPLOAD_SERVICE_URL = `${API_BASE_URL}/upload`;

export async function listAllProjects(): Promise<UploadProject[]> {
  const resp = await fetch(`${UPLOAD_SERVICE_URL}/projects`, { method: 'GET' });
  if (!resp.ok) { throw new Error("Failed listing projects from Upload Service"); }

  return await resp.json();
}

export async function getProject(projectId: string) {
  const resp = await fetch(`${API_BASE_URL}/upload/projects/${projectId}`);
  return await resp.json();
}

export async function getProjectAnalysis(projectId: string) {
  const resp = await fetch(`${API_BASE_URL}/upload/projects/${projectId}/analysis`);
  return await resp.json();
}


async function createUploadServiceProject(): Promise<ProjectUploadResponse> {
  const resp = await fetch(`${UPLOAD_SERVICE_URL}/projects`, { method: 'POST' });

  if (!resp.ok) { throw new Error("Failed creating project at Upload Service"); }

  const json = await resp.json();

  return { projectId: json.projectId, token: json.token };
}

async function uploadFileToUploadServiceProject(upload: ProjectUploadResponse, file: FileSystemFile) {
  const { projectId, token } = upload;

  const body = await file.handle.bytes();

  const resp = await fetch(`${UPLOAD_SERVICE_URL}/projects/${projectId}/files`,
    {
      method: 'POST',
      headers: {
        'X-File-Name': file.path,
        'X-Project-Token': token
      },
      body
    }
  );

  if (!resp.ok) { throw new Error("Failed uploading file to project"); }
}

export async function createProject(fileTree: FileSystemDirectory, progress: ((x: number) => void) | null = null): Promise<string> {
  const files = flattenFileSystem(fileTree);

  const project = await createUploadServiceProject();
  const chunks = chunk(files, 5);

  let uploaded = 0;
  const total = files.length;

  for (const chunk of chunks) {
    const uploadHandlers = chunk.map(file => {
      return (async () => {
        await uploadFileToUploadServiceProject(project, file);

        uploaded += 1;

        progress?.(uploaded / total);
      })();
    });

    await Promise.all(uploadHandlers);
  }

  return project.projectId;
}

export async function downloadFile(projectId: string, fileId: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/upload/projects/${projectId}/files/${fileId}`);

  return await response.text();
}