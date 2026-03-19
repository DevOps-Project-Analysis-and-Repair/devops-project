import type { UploadedFile } from "./api";

export type FileSystemNode = FileSystemDirectory | FileSystemFile;
export type FileSystemDirectory = { kind: 'directory', id: number, name: string, children: FileSystemNode[] };
export type FileSystemFile = { kind: 'file', id: number, name: string, path: string, handle: File, downloadId?: string };

function dir(name: string, id: number): FileSystemDirectory {
  return { kind: 'directory', id, name, children: [] };
}

function file(name: string, path: string, id: number, handle: File): FileSystemFile {
  return { kind: 'file', id, path, name, handle };
}

export function findInDirectory(name: string, dir: FileSystemDirectory): FileSystemNode | null {
  for (const child of dir.children) {
    if (child.kind !== 'directory') { continue; }

    if (child.name === name) { return child; }
  }

  return null;
}

export function filesToFileSystemTree(files: File[]): FileSystemDirectory | null {
  if (files.length === 0) { return null; }

  let id = 0;
  const root = dir(".", id++);

  for (const entry of files) {
    const path = entry.webkitRelativePath || entry.name;
    const pathParts = path.split('/');

    const pathDirectories = pathParts.slice(0, -1);
    const pathFile = pathParts.at(-1);

    let cwd = root;

    for (const part of pathDirectories) {
      const result = findInDirectory(part, cwd);

      if (result === null) {
        const newCwd = dir(part, id++);
        cwd.children.push(newCwd);
        cwd = newCwd;
      } else if (result.kind === "directory") {
        cwd = result;
      }
    }

    cwd.children.push(file(pathFile, path, id++, entry));
  }

  // Remove the root in case a single directory is uploaded  
  if (root.children.length == 1 && root.children[0].kind == "directory") {
    return root.children[0];
  }

  return root;
}

export function uploadFilesToFileSystemTree(files: UploadedFile[]): FileSystemDirectory {
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

export function flattenFileSystem(root: FileSystemDirectory): FileSystemFile[] {
  return root.children.flatMap(node => node.kind === 'file' ? [node] : flattenFileSystem(node));
}

export function getFileExtension(filepath: string): string | undefined {
  const extensionRegExp = /\.([^.]+)$/;
  const res = extensionRegExp.exec(filepath);
  return res?.[1];
}

export async function downloadFile(url: string): Promise<string> {
  const response = await fetch(url);

  return await response.text();
}
