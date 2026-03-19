import { API_BASE_URL } from "../api";



export async function performAnalysis(projectId: string) {
    const resp = await fetch(`${API_BASE_URL}/analysis/${projectId}`, {
        method: "POST",
    });

    return await resp.json();
}

