import { Project, ProjectAnalysis } from "shared";
import { API_SERVICE_URL } from ".";

export async function downloadProject(projectId: string): Promise<Project> {
  const url = `${API_SERVICE_URL}/upload/projects/${projectId}`;
  const res = await fetch(url);

  return await res.json();
}

export async function downloadFile(projectId: string, fileId: string): Promise<string> {
  const url = `${API_SERVICE_URL}/upload/projects/${projectId}/files/${fileId}/latest`;
  const res = await fetch(url);

  return await res.text();
}

export async function downloadAnalysis(projectId: string): Promise<ProjectAnalysis> {
  const url = `${API_SERVICE_URL}/upload/projects/${projectId}/analysis`;
  const res = await fetch(url);

  return await res.json();
}

export async function uploadRepair(projectId: string, fileId: string, code: string): Promise<void> {
  await fetch(`${API_SERVICE_URL}/upload/projects/${projectId}/files/${fileId}/repaired`,
    {
      method: 'POST',
      body: code
    }
  );
}
