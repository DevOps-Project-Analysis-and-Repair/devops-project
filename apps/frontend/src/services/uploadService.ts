import { flattenFileSystem, type FileSystemDirectory, type FileSystemFile } from "../filesystem";
import { chunk } from "../util";

type ProjectUploadResponse = { projectId: string, token: string };

const UPLOAD_SERVICE_URL = "https://jjz7wxr827.execute-api.eu-west-1.amazonaws.com/upload";

export async function listAllProjects(): Promise<Response> {
  const resp = await fetch(`${UPLOAD_SERVICE_URL}/projects`, { method: 'GET' });

  if (!resp.ok) { throw new Error("Failed listing projects from Upload Service"); }

  return resp;
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
  let total = files.length;

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
