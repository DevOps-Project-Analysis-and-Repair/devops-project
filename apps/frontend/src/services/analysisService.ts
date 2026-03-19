import { API_BASE_URL } from "../api";



export async function performAnalysis(projectId: string) {
    await fetch(`${API_BASE_URL}/analysis/${projectId}`, {
        method: "POST",
    });
}

