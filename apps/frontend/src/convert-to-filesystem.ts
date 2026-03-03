import type { UploadedFile } from "./api";
import type { FileSystemDirectory, FileSystemFile } from "./filesystem";

export function convertFilesToFileDirectory(files: UploadedFile[]): FileSystemDirectory {
    let id = 0;

    const root: FileSystemDirectory = {
        id: id++,
        name: "root",
        kind: "directory",
        children: [],
    };

    for (const file of files) {
        const parts = file.filename.split("/");
        let current = root;

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;

            if (isFile) {
                const filesystemFile: FileSystemFile = {
                    id: id++,
                    kind: "file",
                    name: part,
                    path: file.filename,
                    downloadId: file.id,
                    handle: new File([], file.filename),
                }
                current.children.push(filesystemFile);
            } else {
                let dir = current.children.find(
                    (c) => c.kind === "directory" && c.name === part
                ) as FileSystemDirectory | undefined;

                if (!dir) {
                    dir = {
                        id: id++,
                        kind: "directory",
                        name: part,
                        children: [],
                    };
                    current.children.push(dir);
                }

                current = dir;
            }
        });
    }

    return root;
}