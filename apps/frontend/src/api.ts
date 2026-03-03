
export const API_BASE_URL =
    "https://jjz7wxr827.execute-api.eu-west-1.amazonaws.com";


export interface UploadProject {
    files: any[];
    id: string;
    name: string;
}

export interface UploadedFile {
    id: string;
    url: string;
    mimetype: string;
    filename: string
}