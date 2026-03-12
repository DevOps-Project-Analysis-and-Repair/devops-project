
export const API_BASE_URL: string =
    "https://jjz7wxr827.execute-api.eu-west-1.amazonaws.com";

export const BASE_URL: string = import.meta.env.PROD ? API_BASE_URL : "http://127.0.0.1:4000";


export interface UploadProject {
    files: unknown[];
    id: string;
    name: string;
}

export interface UploadedFile {
    id: string;
    url: string;
    mimetype: string;
    filename: string
}