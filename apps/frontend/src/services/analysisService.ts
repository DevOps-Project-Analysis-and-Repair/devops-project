import { API_BASE_URL } from "../api";

export async function performAnalysis(projectId: string) {
    const res = await fetch(`${API_BASE_URL}/analysis/${projectId}`, {
        method: "POST",
    });

    return await res.json();
}

export async function getAnalysis(projectId: string) {
    const res = await fetch(`${API_BASE_URL}/upload/projects/${projectId}/analysis`);
    return await res.json();
}