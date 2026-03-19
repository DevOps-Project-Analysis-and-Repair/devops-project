import { API_BASE_URL } from "../utils/api";

export async function fixFile(projectId: string, fileId: string) {
    await fetch(
        `${API_BASE_URL}/fix/projects/${projectId}/files/${fileId}`,
        {
            method: "POST",
        },
    );
}