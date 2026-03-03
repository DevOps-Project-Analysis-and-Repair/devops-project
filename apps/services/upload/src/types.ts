export type ProjectFile = {
    id: string,
    url: string, // s3 bucket url
    filename: string,
    mimetype: string,
}

export type Project = {
    id: string,
    name: string,
    files: ProjectFile[];
    createdAt: number,
};
